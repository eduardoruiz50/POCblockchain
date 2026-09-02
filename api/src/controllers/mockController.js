exports.getSiexExplotacion = (req, res) => {
  const { id } = req.params;
  
  if (id === 'ES00000012345') {
    return res.json({
      "codigoSIEX": "ES00000012345",
      "codigoREGA": "ES190010000123",
      "codigoRESEX": "ES-19-1234",
      "estado": "ACTIVA",
      "fechaAlta": "2023-01-15",
      "titular": {
        "tipoPersona": "JURIDICA",
        "cif": "B12345678",
        "razonSocial": "Explotaciones Apícolas de Prueba S.L.",
        "comunidadAutonoma": "CASTILLA_LA_MANCHA"
      },
      "delimitacionGeografica": {
        "provincia": "19",
        "municipio": "001",
        "referenciaCatastral": "19001A001000010000WX"
      },
      "actividades": [
        {
          "tipo": "GANADERA",
          "subtipo": "APICULTURA",
          "orientacionProductiva": "MIEL_Y_CERA",
          "numeroColmenas": 150,
          "codigoExplotacionREGA": "ES190010000123"
        }
      ],
      "metadatosRespuesta": {
        "timestamp": "2026-09-02T18:54:16Z",
        "versionEsquema": "SIEX_v2.1",
        "codigoResultado": "00",
        "mensaje": "Consulta realizada con éxito"
      }
    });
  } else {
    return res.status(404).json({ error: "Explotación no encontrada en el mock SIEX" });
  }
};

exports.getTracesOperator = (req, res) => {
  const { id } = req.params;
  
  if (id === 'ES-BIO-001-TEST') {
    return res.json({
      "operatorId": "ES-BIO-001-TEST",
      "nationalId": "B12345678",
      "companyName": "Mieles y Apicultura de Prueba S.L.",
      "country": "ESP",
      "status": "APPROVED",
      "address": {
        "street": "Calle Mayor 12",
        "postalCode": "19001",
        "city": "Guadalajara",
        "countryCode": "ES"
      },
      "activities": [
        {
          "activityType": "FOOD_EXPORTER",
          "section": "HONEY_PRODUCTS",
          "status": "VALIDATED",
          "competentAuthority": "ES-MAPA-01"
        }
      ]
    });
  } else {
    return res.status(404).json({ error: "Operador no encontrado en el mock TRACES NT" });
  }
};
