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

const { AuthClientTwoLegged } = require('forge-apis');
const config = require('../../config');
const axios = require('axios');
const qs = require('qs');

/**
 * Initializes a Forge client for 2-legged authentication.
 * @param {string[]} scopes List of resource access scopes.
 * @returns {AuthClientTwoLegged} 2-legged authentication client.
 */
function getClient(scopes) {
    const { client_id, client_secret } = config.credentials;
    return new AuthClientTwoLegged(client_id, client_secret, scopes || config.scopes.internal);
}

let cache = {};
async function getToken(scopes) {
    const key = scopes.join('+');
    if (cache[key]) {
        return cache[key];
    }
    const client = getClient(scopes);
    let credentials = await client.authenticate();
    cache[key] = credentials;
    setTimeout(() => { delete cache[key]; }, credentials.expires_in * 1000);
    return credentials;
}

/**
 * Retrieves a 2-legged authentication token for preconfigured public scopes.
 * @returns Token object: { "access_token": "...", "expires_at": "...", "expires_in": "...", "token_type": "..." }.
 */
async function getPublicToken() {
    const clientId = config.credentials.client_id;
    const clientSecret = config.credentials.client_secret;
    const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const tokenUrl = 'https://developer.api.autodesk.com/authentication/v2/token'; // olho aqui

    const data = qs.stringify({
        grant_type: 'client_credentials',
        scope: 'data:read'
    });

    const axiosConfig = {
        method: 'post',
        url: tokenUrl,
        headers: {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: data
    };

    try {
        const response = await axios(axiosConfig);
        return response.data;
    } catch (error) {
        console.error('Error fetching public token', error);
        throw error;
    }
}

/**
 * Retrieves a 2-legged authentication token for preconfigured internal scopes.
 * @returns Token object: { "access_token": "...", "expires_at": "...", "expires_in": "...", "token_type": "..." }.
 */
async function getInternalToken() {
    return getToken(config.scopes.internal);
}

module.exports = {
    getClient,
    getPublicToken,
    getInternalToken
};


