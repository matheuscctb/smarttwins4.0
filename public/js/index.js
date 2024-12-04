var viewer;
var viewer1;

function showViewer() {



    var options = {
        env: 'AutodeskProduction',
        api: 'derivativeV2', // TODO: for models uploaded to EMEA change this option to 'derivativeV2_EU'
        getAccessToken: getForgeToken
    };

    Autodesk.Viewing.Initializer(options, function(event) {



        var tipo = document.querySelector('[aria-selected="true"]').textContent;
        if (tipo == "Tempo Real") {

            viewer = new Autodesk.Viewing.GuiViewer3D(document.getElementById('forgeViewer'), {
                extensions: ['PanelInfoViewerExtension']
            });
            viewer.start();

            firebase.database().ref(`obras/${$('#obras').val()}/urn`).on('value', function(snapshot) {

                var urn = snapshot.val();

                /* var documentId = 'urn:dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6eW9jaXhnd2RjbnB2b2dham5nZDNkZjhleXRjZHJ6eGEtcmVzZXJ2YXNfZG9fcGljdWFpYS9TTlJfSEFCX0ZJWF8wMl8yMDE5X1IyLnJ2dA=='; */

                var documentId = 'urn:' + urn;
                Autodesk.Viewing.Document.load(documentId, onDocumentLoadSuccess, onDocumentLoadFailure);

            });
        } else {
            setTimeout(function() {
                viewer1 = new Autodesk.Viewing.GuiViewer3D(document.getElementById('forgeViewer1'), {
                    extensions: ['ManutencaoViewerExtension', 'PanelInfoViewerExtension', ]


                });

                viewer1.start()

                firebase.database().ref(`obras/${$('#obras').val()}/urn`).on('value', function(snapshot) {

                    var urn = snapshot.val();
                    var documentId1 = 'urn:' + urn;
                    /* var documentId1 = 'urn:dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6eW9jaXhnd2RjbnB2b2dham5nZDNkZjhleXRjZHJ6eGEtcmVzZXJ2YXNfZG9fcGljdWFpYS9TTlJfSEFCX0ZJWF8wMl8yMDE5X1IyLnJ2dA=='; */

                    Autodesk.Viewing.Document.load(documentId1, onDocumentLoadSuccess1, onDocumentLoadFailure1);

                });


            }, 300);

        }

    });

    function onDocumentLoadSuccess1(doc) {
        $('#cardMsgForgeViewer').hide()
            // if a viewableId was specified, load that view, otherwise the default view
        var viewables1 = doc.getRoot().getDefaultGeometry();
        viewer1.loadDocumentNode(doc, viewables1).then(i => {
            // any additional action here?
        });
    }

    function onDocumentLoadFailure1(viewerErrorCode) {
        $('#cardMsgForgeViewer').show()
        console.error('onDocumentLoadFailure() - errorCode:' + viewerErrorCode);
    }


    /* function onDocumentLoadSuccessInteiro(doc) {
        var viewables = doc.getRoot().getDefaultGeometry();
        viewer.loadDocumentNode(doc, viewables).then(i => {})
    } */

    function onDocumentLoadSuccess(doc) {
        $('#cardMsgForgeViewer').hide()

        var viewables = doc.getRoot().getDefaultGeometry();
        viewer.loadDocumentNode(doc, viewables).then(i => {
            // documented loaded, any action?

            var obra = document.getElementById('obras').value;
            var bloco = document.getElementById('bloco').value;
            var vetorBlocos = []

            if (bloco == "empty") {
                var vetorTodosElementos = []
                getAllLeafComponents(viewer, (dbIds) => {
                    //Propriedade que quero buscar das elemetos dos setores e formas
                    const filteredProps = ['Numeração', "Agrupamento"];
                    // Get only the properties we need for the leaf dbIds
                    this.viewer.model.getBulkProperties(dbIds, filteredProps, (items) => {
                        // Iterate through the elements we found
                        items.forEach((item) => {
                            // and iterate through each propertys
                            item.properties.forEach(function(prop) {
                                vetorTodosElementos.push(item);
                            });
                        });
                        //Removendo elementos duplicados
                        var elementos = [...new Set(vetorTodosElementos)];

                        var isolated = []
                        elementos.forEach(value => {
                            //Sem forma
                            if (value.properties.length == 1) {
                                //Só a fundação
                                if (value.properties[0].displayValue == "P0") {
                                    isolated.push(value.dbId);
                                }
                            }
                        })



                        viewer.isolate(isolated)
                        viewer.setGhosting(false);
                    });
                });

            } else {


                firebase.database().ref('obras/' + obra + '/sequenciareal/' + bloco).once('value').then(snapshot => {
                    let identificacao = ""
                    console.log('alteração aqui 137')
                    snapshot.forEach(function(pavimento) {
                        pavimento.forEach((meiopavimento) => {
                            //Identifica se os meio pavimento em construção
                            if (parseInt(pavimento.key.substr(1), 10) >= 10) {
                                identificacao = pavimento.key + meiopavimento.key
                                    //P10MPCE
                            } else {
                                identificacao = pavimento.key.substr(0, 1) + pavimento.key.substr(2) + meiopavimento.key
                                    //P1MPSE

                            }
                            vetorBlocos.push(identificacao)
                                //[P1MPCE,P1MPSE,P2...,P5MPSE]
                        })


                    });
                    var vetorTodosElementos = []
                    getAllLeafComponents(viewer, (dbIds) => {
                        //Propriedade que quero buscar das elemetos dos setores e formas
                        const filteredProps = ['Numeração', "Agrupamento"];
                        // Get only the properties we need for the leaf dbIds
                        this.viewer.model.getBulkProperties(dbIds, filteredProps, (items) => {
                            // Iterate through the elements we found
                            items.forEach((item) => {
                                // and iterate through each propertys
                                item.properties.forEach(function(prop) {
                                    vetorTodosElementos.push(item);
                                });
                            });
                            //Removendo elementos duplicados
                            var elementos = [...new Set(vetorTodosElementos)];

                            var isolated = []
                            var aux = 0;


                            elementos.forEach(value => {
                                //Sem forma

                                if (value.properties.length == 1) {


                                    for (i = vetorBlocos.length - 1; i >= 0; i--) {
                                        //Identifica os pavimentos já construídos/em construção
                                        if (value.properties[0].displayValue == vetorBlocos[i] ||
                                            value.properties[0].displayValue == "P0") {
                                            isolated.push(value.dbId);

                                        }
                                    }



                                } else {
                                    //Com forma
                                    if (value.properties[0].displayValue.substr(0, 6) == vetorBlocos[vetorBlocos.length - 1]) {
                                        isolated.push(value.dbId);

                                    }
                                }
                            })



                            viewer.isolate(isolated)
                            viewer.setGhosting(false);
                        });
                    });

                });
            }
        });
        // NestedViewerExtension
        viewer.loadExtension("NestedViewerExtension", {
                filter: ["2d", "3d"],
                crossSelection: true
            })
            // NestedViewerExtension
    }

    function onDocumentLoadFailure(viewerErrorCode) {
        $('#cardMsgForgeViewer').show()
        console.error('onDocumentLoadFailure() - errorCode:' + viewerErrorCode);
    }

    /* function onDocumentLoadFailureInteiro(viewerErrorCode) {
        console.error('onDocumentLoadFailure() - errorCode:' + viewerErrorCode);
    } */

    function getForgeToken(callback) {
        fetch('/api/forge/oauth/token').then(res => {
            res.json().then(data => {
                callback(data.access_token, data.expires_in);
            });
        });
    }
}

$('#obras').on('change', function() {
    var obra = $('#obras').val();
    $("#bloco").empty();
    $('[apagar="inteiro"]').html(`<div class="col-lg-12" id="forgeViewer1"></div>`)
    $('[apagar="real"]').html(`<div class="col-lg-12" id="forgeViewer"></div>`)
    firebase.database().ref('obras/' + obra).on('value', function(snapshot) {
        console.log('alteração aqui 242')
        if (snapshot.child('sequenciareal').val()) {
            snapshot.child('sequenciareal').forEach(function(bloco) {
                $('#bloco').append(`<option value="${bloco.key}">${bloco.key}</option>`)
            });
            $('[apagar="real"]').html(`<div class="col-lg-12" id="forgeViewer"></div>`)
            showViewer()
        } else {
            $('#bloco').append(`<option value="empty">Sem Bloco</option>`)
            showViewer()
                //$('[apagar="real"]').html(`<div class="col-lg-12" id="forgeViewer"><img src="./img/erromodelo.jpg" alt="Erro Modelo" class="col-lg-12 shadow" ></div>`)

        }
    })



});



$('#inteiro-tab').on('click', function() {
    if ($('#bloco').val() != "empty") {

        if ($('#forgeViewer1').is(':empty')) {
            showViewer()
        }
    } else {
        showViewer()
            //$('[apagar="inteiro"]').html(`<div class="col-lg-12" id="forgeViewer1"><img src="./img/erromodelo.jpg" alt="Erro Modelo" class="col-lg-12 shadow" ></div>`)
    }




})

$('#bloco').on('change', function() {
    $('[apagar="real"]').html(`<div class="col-lg-12" id="forgeViewer"></div>`)
    showViewer()
})


firebase.database().ref('obras/').on('value', function(snapshot) {
    var config = { obra: "", bloco: "" }
    if ($('#obras').val() && $('#bloco').val()) {
        config.obra = $('#obras').val()
        config.bloco = $('#bloco').val()
    }

    $('#obras').html('');
    snapshot.forEach((obra) => {
        $('#obras').append(`<option value="${obra.key}">${obra.key}</option>`)
    });

    if (snapshot.child($('#obras').val()).child('sequenciareal')) {
        snapshot.child($('#obras').val()).child('sequenciareal').forEach(function(bloco) {
            $('#bloco').append(`<option value="${bloco.key}">${bloco.key}</option>`)
        });
    } else {
        $('#bloco').append(`<option value="empty">Sem Bloco</option>`)
            //$('[apagar="real"]').html(`<div class="col-lg-12" id="forgeViewer"><img src="./img/erromodelo.jpg" alt="Erro Modelo" class="col-lg-12 shadow" ></div>`)
    }
    showViewer()

    if (config.obra && config.bloco) {
        $('#obras').val(config.obra)
        $('#bloco').val(config.bloco)
    }

})