/////////////////////////////////////////////////////////////////////
// Copyright (c) Autodesk, Inc. All rights reserved
// Written by Forge Partner Development
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
/////////////////////////////////////////////////////////////////////

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const axios = require('axios');
const { ObjectsApi } = require('forge-apis');

const router = express.Router();

// Configuração do multer para upload temporário
const upload = multer({ dest: 'uploads/' });

// Endpoint para upload de arquivos usando URL assinada
router.post('/objects', upload.single('fileToUpload'), async (req, res, next) => {
  try {
    const filePath = req.file.path; // Caminho do arquivo local no servidor
    const fileSize = fs.statSync(filePath).size; // Tamanho do arquivo
    const fileName = req.file.originalname; // Nome original do arquivo

    // 1. Gerar URL assinada para upload no APS
    const signedUrlResponse = await new ObjectsApi().createSignedResource(
      req.body.bucketKey,   // Bucket Key
      fileName,             // Nome do arquivo
      'write',              // Permissão de upload
      { minutesExpiration: 15 }, // Tempo de validade do URL
      req.oauth_client,     // Objeto do cliente OAuth
      req.oauth_token       // Token de acesso
    );

    const uploadUrl = signedUrlResponse.body.signedUrl; // URL de upload

    // 2. Ler o arquivo localmente
    const fileData = fs.readFileSync(filePath);

    // 3. Fazer upload do arquivo para a URL assinada
    await axios.put(uploadUrl, fileData, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': fileSize,
      },
    });

    // 4. Limpar o arquivo temporário após upload
    fs.unlinkSync(filePath);

    // 5. Retornar resposta ao cliente
    res.status(200).send({ message: 'Arquivo enviado com sucesso!' });
  } catch (err) {
    // Tratamento de erros
    next(err);
  }
});

module.exports = router;

