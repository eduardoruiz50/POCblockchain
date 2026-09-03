// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title MielBierzoDPP1155
 * @notice Implementación del Pasaporte Digital de Producto (DPP) para la D.O.P. Miel del Bierzo.
 * Diseñado para pequeños productores bajo el estándar ERC-1155 (Multi-Token).
 * Permite tokenizar la cantidad exacta de tarros físicos ($N$) producidos en cada lote.
 */
contract MielBierzoDPP1155 is ERC1155, AccessControl {
    using Strings for uint256;

    // Roles del sistema
    bytes32 public constant APICULTOR_ROLE = keccak256("APICULTOR_ROLE");
    bytes32 public constant CONSEJO_REGULADOR_ROLE = keccak256("CONSEJO_REGULADOR_ROLE");

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
     * @dev Configura el Administrador y asigna el rol del Consejo Regulador.
     * @param admin Dirección wallet encargada de la administración del contrato.
     * @param consejoRegulador Dirección wallet autorizada para auditar y certificar lotes DOP.
     */
    constructor(address admin, address consejoRegulador) ERC1155("") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(CONSEJO_REGULADOR_ROLE, consejoRegulador);
    }

    /**
     * @notice Fase 1: Registro y Minado Masivo del Lote de Miel por el Apicultor.
     * @dev Genera un nuevo Token ID ERC-1155 con $N$ unidades equivalentes al número de tarros producidos.
     * @param apicultor Dirección que recibirá los tokens de los tarros físicamente producidos.
     * @param loteId Código identificador del lote de producción.
     * @param gtin Identificador de producto de la norma GS1.
     * @param cantidadTarros Número de tarros producidos y empaquetados en este lote.
     * @param ipfsURI Enlace descentralizado IPFS que apunta al archivo JSON-LD.
     * @param regaProofHash Hash criptográfico del libro de explotación apícola.
     * @param tracesProofHash Hash criptográfico de la autorización de traslado sanitario.
     */
    function mintDPPBatch(
        address apicultor,
        string calldata loteId,
        string calldata gtin,
        uint256 cantidadTarros,
        string calldata ipfsURI,
        bytes32 regaProofHash,
        bytes32 tracesProofHash
    ) external onlyRole(APICULTOR_ROLE) returns (uint256) {
        require(loteToTokenId[loteId] == 0, "Error: El LoteID ya ha sido registrado previamente");
        require(cantidadTarros > 0, "Error: La cantidad de tarros debe ser mayor que cero");

        _tokenIdCounter++;
        uint256 newTokenId = _tokenIdCounter;

        // Minado ERC-1155: Asigna 'cantidadTarros' tokens del 'newTokenId' a la wallet del apicultor
        _mint(apicultor, newTokenId, cantidadTarros, "");

        // Almacenamiento de metadatos de auditoría en estado 'PENDIENTE_CERTIFICACION'
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

        emit BatchMinted(newTokenId, loteId, gtin, cantidadTarros, apicultor);

        return newTokenId;
    }

    /**
     * @notice Fase 2: Certificación DOP por parte del Consejo Regulador.
     * @dev Solo la wallet con CONSEJO_REGULADOR_ROLE puede dictaminar si el lote cumple la DOP Bierzo.
     * @param loteId Identificador del lote a examinar.
     * @param dopCertHash Hash del informe oficial de análisis de laboratorio.
     * @param aprobado True para aprobar la D.O.P., False para denegarla.
     */
    function certifyLot(
        string calldata loteId,
        bytes32 dopCertHash,
        bool aprobado
    ) external onlyRole(CONSEJO_REGULADOR_ROLE) {
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
