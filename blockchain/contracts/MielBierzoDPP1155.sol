// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MielBierzoDPP1155
 * @notice Implementación del Pasaporte Digital de Producto (DPP) para la D.O.P. Miel del Bierzo.
 * Arquitectura basada en Relayer / Operador Web3 y Oráculo:
 * - El Relayer (RELAYER_ROLE) orquesta y costea el gas de transacciones de minado y transferencias autorizadas.
 * - El Oráculo / Consejo Regulador (ORACULO_ROLE / CONSEJO_REGULADOR_ROLE) certifica lotes según dictamen de laboratorio.
 */
contract MielBierzoDPP1155 is ERC1155, AccessControl, ReentrancyGuard {
    // Roles del sistema
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");
    bytes32 public constant APICULTOR_ROLE = keccak256("APICULTOR_ROLE");
    bytes32 public constant CONSEJO_REGULADOR_ROLE = keccak256("CONSEJO_REGULADOR_ROLE");
    bytes32 public constant ORACULO_ROLE = keccak256("ORACULO_ROLE");

    // Estados de certificación del lote
    enum EstadoDPP { PENDIENTE_CERTIFICACION, CERTIFICADO_DOP_BIERZO, RECHAZADO }

    // Estructura de datos inmutable del lote auditado
    struct LoteDPP {
        string loteId;           // Ej: "L-2026-CAST01"
        string gtin;             // Código comercial GS1 (14 dígitos)
        uint256 cantidadTarros;  // Emisión inicial total de tarros en el lote
        bytes32 regaProofHash;   // Hash de la evidencia de explotación (SIEX / REGA)
        bytes32 tracesProofHash; // Hash del documento de trazabilidad Sanitaria (TRACES)
        bytes32 dopCertHash;     // Hash del análisis polínico/fisicoquímico del laboratorio DOP
        EstadoDPP estado;        // Estado actual de certificación
        string ipfsURI;          // Enlace IPFS a los metadatos JSON-LD del DPP
    }

    // Mapeo: TokenID (uint256) => Datos del Lote
    mapping(uint256 => LoteDPP) public lotes;

    // Mapeo inverso: LoteID (string) => TokenID (uint256)
    mapping(string => uint256) public loteToTokenId;

    // Contador secuencial para generar los TokenIDs
    uint256 private _tokenIdCounter;

    // Eventos
    event BatchMinted(
        uint256 indexed tokenId, 
        string loteId, 
        string gtin, 
        uint256 cantidadTarros, 
        address indexed apicultor
    );
    
    event BatchCertified(
        uint256 indexed tokenId, 
        string loteId, 
        bytes32 dopCertHash, 
        EstadoDPP estado
    );

    /**
     * @dev Configura el Administrador, el Relayer y el Consejo Regulador / Oráculo.
     * @param admin Dirección wallet encargada de la administración del contrato.
     * @param relayer Dirección del Relayer que procesa y patrocina las transacciones.
     * @param consejoRegulador Dirección autorizada para auditar y certificar lotes DOP.
     */
    constructor(address admin, address relayer, address consejoRegulador) ERC1155("") {
        require(admin != address(0), "Error: Admin direccion cero");
        require(relayer != address(0), "Error: Relayer direccion cero");
        require(consejoRegulador != address(0), "Error: Consejo direccion cero");

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        
        // Roles para el Relayer de la plataforma
        _grantRole(RELAYER_ROLE, relayer);
        _grantRole(APICULTOR_ROLE, relayer);

        // Roles para la certificación D.O.P.
        _grantRole(CONSEJO_REGULADOR_ROLE, consejoRegulador);
        _grantRole(ORACULO_ROLE, consejoRegulador);
        _grantRole(ORACULO_ROLE, relayer); // Permite al relayer registrar veredictos validados por oráculo backend
    }

    /**
     * @notice Fase 1: Registro y Minado Masivo del Lote (Ejecutado por el Relayer o Apicultor).
     * @dev Genera un nuevo Token ID ERC-1155 con N unidades y las asigna a la wallet del apicultor.
     * Aplica el patrón Checks-Effects-Interactions (CEI) y nonReentrant para mitigar vulnerabilidades de reentrancia.
     */
    function mintDPPBatch(
        address apicultor,
        string calldata loteId,
        string calldata gtin,
        uint256 cantidadTarros,
        string calldata ipfsURI,
        bytes32 regaProofHash,
        bytes32 tracesProofHash
    ) external nonReentrant returns (uint256) {
        require(
            hasRole(RELAYER_ROLE, msg.sender) || hasRole(APICULTOR_ROLE, msg.sender),
            "Error: Requiere rol RELAYER_ROLE o APICULTOR_ROLE"
        );
        require(apicultor != address(0), "Error: Apicultor direccion cero");
        require(bytes(loteId).length > 0, "Error: LoteID no puede ser vacio");
        require(loteToTokenId[loteId] == 0, "Error: El LoteID ya ha sido registrado previamente");
        require(cantidadTarros > 0, "Error: La cantidad de tarros debe ser mayor que cero");
        require(bytes(ipfsURI).length > 0, "Error: IPFS URI no puede ser vacio");

        _tokenIdCounter++;
        uint256 newTokenId = _tokenIdCounter;

        // [EFECTOS DE ESTADO ANTES DE CUALQUIER INTERACCIÓN EXTERNA]
        lotes[newTokenId] = LoteDPP({
            loteId: loteId,
            gtin: gtin,
            cantidadTarros: cantidadTarros,
            regaProofHash: regaProofHash,
            tracesProofHash: tracesProofHash,
            dopCertHash: bytes32(0),
            estado: EstadoDPP.PENDIENTE_CERTIFICACION,
            ipfsURI: ipfsURI
        });

        // Mapear la clave textual del Lote al identificador numérico de token
        loteToTokenId[loteId] = newTokenId;

        // [INTERACCIÓN EXTERNA: Minado ERC-1155 que invoca hooks onERC1155Received]
        _mint(apicultor, newTokenId, cantidadTarros, "");

        emit BatchMinted(newTokenId, loteId, gtin, cantidadTarros, apicultor);

        return newTokenId;
    }

    /**
     * @notice Fase 2: Certificación DOP por Oráculo / Consejo Regulador / Relayer autorizado.
     * @param loteId Identificador del lote a examinar.
     * @param dopCertHash Hash del informe oficial de análisis de laboratorio.
     * @param aprobado True para aprobar la D.O.P., False para denegarla.
     */
    function certifyLot(
        string calldata loteId,
        bytes32 dopCertHash,
        bool aprobado
    ) external {
        require(
            hasRole(CONSEJO_REGULADOR_ROLE, msg.sender) || 
            hasRole(ORACULO_ROLE, msg.sender) || 
            hasRole(RELAYER_ROLE, msg.sender),
            "Error: No autorizado para certificar lote"
        );
        require(dopCertHash != bytes32(0), "Error: Hash de certificado invalido");

        uint256 tokenId = loteToTokenId[loteId];
        require(tokenId != 0, "Error: El lote especificado no existe");
        require(lotes[tokenId].estado == EstadoDPP.PENDIENTE_CERTIFICACION, "Error: El lote ya fue procesado");

        if (aprobado) {
            lotes[tokenId].estado = EstadoDPP.CERTIFICADO_DOP_BIERZO;
            lotes[tokenId].dopCertHash = dopCertHash;
        } else {
            lotes[tokenId].estado = EstadoDPP.RECHAZADO;
        }

        emit BatchCertified(tokenId, loteId, dopCertHash, lotes[tokenId].estado);
    }

    /**
     * @notice Fase 3: Transferencia delegada de custodia operada por el Relayer.
     * @dev Función administrativa que utiliza `_safeTransferFrom` para transferir tokens directamente
     * sin requerir aprobación previa en cadena (`isApprovedForAll`). Este diseño permite al Relayer
     * mover stock en nombre del apicultor abstrayendo la complejidad de MetaMask y el coste de gas.
     * Restringido estrictamente a cuentas autorizadas con RELAYER_ROLE.
     * @param from Dirección de origen desde la que se descuentan los tarros.
     * @param to Dirección de destino (comercio, distribuidor o cliente final).
     * @param id Token ID correspondiente al lote de miel.
     * @param value Cantidad de unidades/tarros a transferir.
     * @param data Datos adicionales pasados al receptor si es un contrato inteligente.
     */
    function relayerTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external onlyRole(RELAYER_ROLE) {
        // Ejecuta la transferencia directa de custodia validando la recepción en el destino (_safeTransferFrom)
        _safeTransferFrom(from, to, id, value, data);
    }

    /**
     * @notice Consulta dinámica de metadatos IPFS para un Token ID determinado.
     * @param tokenId Identificador numérico del lote en la blockchain.
     */
    function uri(uint256 tokenId) public view override returns (string memory) {
        require(lotes[tokenId].cantidadTarros > 0, "Error: El token consultado no existe");
        return lotes[tokenId].ipfsURI;
    }

    /**
     * @notice Función de consulta rápida de información estructurada del lote.
     * @param loteId Identificador alfanumérico del lote (ej: "L-2026-CAST01").
     */
    function getLoteByLoteId(string calldata loteId) external view returns (
        uint256 tokenId,
        string memory gtin,
        uint256 cantidadTarros,
        bytes32 regaProofHash,
        bytes32 tracesProofHash,
        bytes32 dopCertHash,
        EstadoDPP estado,
        string memory ipfsURI
    ) {
        tokenId = loteToTokenId[loteId];
        require(tokenId != 0, "Error: Lote no encontrado");
        
        LoteDPP memory lote = lotes[tokenId];
        return (
            tokenId,
            lote.gtin,
            lote.cantidadTarros,
            lote.regaProofHash,
            lote.tracesProofHash,
            lote.dopCertHash,
            lote.estado,
            lote.ipfsURI
        );
    }

    /**
     * @dev Requisito del estándar OpenZeppelin para la compatibilidad multi-interfaz (ERC1155 + AccessControl).
     */
    function supportsInterface(bytes4 interfaceId) public view override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
