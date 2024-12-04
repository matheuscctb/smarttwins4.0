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

var viewer;

function launchViewer(urn) {
    var options = {
        env: 'AutodeskProduction',
        getAccessToken: getForgeToken
    };


    Autodesk.Viewing.Initializer(options, () => {
        viewer = new Autodesk.Viewing.GuiViewer3D(document.getElementById('forgeViewer'), { extensions: ['PanelInfoViewerExtension', ] });
        viewer.start();

        console.log('urn: ', urn)
        var documentId = 'urn:' + urn;
        this.urn1 = urn;


        /*  firebase.database().ref(`obras/${obraAtual}`).on('value', function(snapshot) {
            

        })
 */
        Autodesk.Viewing.Document.load(documentId, onDocumentLoadSuccess, onDocumentLoadFailure);
    });
}

function onDocumentLoadSuccess(doc) {
    var viewables = doc.getRoot().getDefaultGeometry();
    viewer.loadDocumentNode(doc, viewables).then(i => {
        // documented loaded, any action?
        $("#btn-salvar").removeAttr('disabled');

    });


}

function onDocumentLoadFailure(viewerErrorCode) {
    console.error('onDocumentLoadFailure() - errorCode:' + viewerErrorCode);
}

function getForgeToken(callback) {
    fetch('/api/forge/oauth/token').then(res => { 
        res.json().then(data => {
            callback(data.access_token, data.expires_in);
        });
    });
}

function salvarUrn() {
    node = $('#appBuckets').jstree(true).get_selected(true)[0];
    var urn = node.id;
    var obraAtual = $('#obrasBucket').val()

    if (obraAtual != "Obras") {
        var updates = {};
        updates[`/obras/${obraAtual}/urn`] = urn;

        firebase.database().ref().update(updates)
        window.location.href = "index.html ";
    } else {
        alert('Selecione uma obra')
    }
}


$("#btn-salvar").on('click', function() {
    salvarUrn();
});

firebase.database().ref('obras/').on('value', function(snapshot) {
    $('#obrasBucket').html('<option selected>Obras</option>')
    snapshot.forEach(function(obra) {
        $('#obrasBucket').append(`<option value="${obra.key}">${obra.key.toUpperCase()}</option>`)
    });
});