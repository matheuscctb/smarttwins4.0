class ManutencaoViewerExtension extends Autodesk.Viewing.Extension {

    constructor(viewer1, options) {
        super(viewer1, options);
        this._group = null;
        this._button = null;
    }

    load() {
        console.log('ManutencaoViewerExtensions has been loaded');
        return true;
    }

    unload() {
        // Clean our UI elements if we added any
        if (this._group) {
            this._group.removeControl(this._button);
            if (this._group.getNumberOfControls() === 0) {
                this.viewer1.toolbar.removeControl(this._group);
            }
        }
        console.log('ManutencaoViewerExtensions has been unloaded');
        return true;
    }


    onToolbarCreated() {
        // Create a new toolbar group if it doesn't exist
        this._group = this.viewer.toolbar.getControl('nestedViewerExtensionToolbar');
        if (!this._group) {
            this._group = new Autodesk.Viewing.UI.ControlGroup('nestedViewerExtensionToolbar');
            this.viewer.toolbar.addControl(this._group);
        }

        // Add a new button to the toolbar group
        this._button = new Autodesk.Viewing.UI.Button('ManutencaoViewerExtensionButton');
        this._button.onClick = (ev) => {
            //console.log('clicou')
            $('.square').show()
            $('#ManutencaoViewerExtensionButton').addClass('active')





            var vetorTodosElementos = [];
            //encontra todos os dbIds da visualização
            getAllLeafComponents(viewer1, (dbIds) => {
                //Propriedade que quero buscar das formas
                const filteredProps = ['Numeração', "Agrupamento"];
                // Get only the properties we need for the leaf dbIds
                this.viewer.model.getBulkProperties(dbIds, filteredProps, (items) => {
                    // Iterate through the elements we found
                    items.forEach((item) => {
                        //console.log('item: ',item)
                        // and iterate through each property
                        item.properties.forEach(function(prop) {
                            if (prop.displayValue) {
                                vetorTodosElementos.push(item);

                            }
                        });
                    });
                    //console.log('vetorTodosElementos: ', vetorTodosElementos)
                    //Seleciono todas as formas com informações de agrupamentos e numeração
                    var formas = []

                    vetorTodosElementos.forEach((value) => {
                            if (value.properties.length > 1) {
                                if (value.properties[0].displayValue && value.properties[1].displayValue) {
                                    formas.push(value);
                                    //console.log('value: ',value)
                                    //console.log('formas: ',formas)
                                }
                            }

                        })
                        //As formas acabaram duplicadas, aqui acontece a separação
                    var formasFinal = [...new Set(formas)];

                    //console.log('formasfinal: ', formasFinal)
                    //Localizar RFID com a data da leitura no Firebase
                    const x = getInfoLeituras(formasFinal)
                        .then(
                            res => {
                                getHistorico(res).then(response => {
                                    console.log('FIM')
                                    $('.square').hide()
                                    $('#ManutencaoViewerExtensionButton').removeClass('active')
                                })
                            })
                });
            });
        };
        this._button.setToolTip('Manuntenção & Defeito');
        this._button.addClass('ManutencaoViewerExtensionIcon');
        this._group.addControl(this._button);
    }
}

Autodesk.Viewing.theExtensionManager.registerExtension('ManutencaoViewerExtension', ManutencaoViewerExtension);

async function getRfidAndData(data) {
    for (const value of data) {
        var agrupamento = value.properties[0].displayValue;
        var numero = value.properties[1].displayValue;
        //console.log(`agrupamento: ${agrupamento}  numero: ${numero}`)

        await getInfoRfidDataFirebase(agrupamento, numero).then(response => {
            if (response[0] && response[1]) {
                value.properties[2] = { displayName: "rfid", displayValue: response[0] };
                value.properties[3] = { displayName: "dataLeitura", displayValue: response[1] };
            } else {
                value.properties[2] = { displayName: "rfid", displayValue: null };
                value.properties[3] = { displayName: "dataLeitura", displayValue: null };
            }
        })

    }
    //console.log('data: ', data)
    return await data;
    return data;
}

function getInfoRfidDataFirebase(agrupamento, numero) {
    return new Promise(resolve => {

        if (agrupamento && numero) {
            var obra = document.getElementById('obras').value;
            var bloco = document.getElementById('bloco').value;
            let numpav = parseInt(agrupamento.substr(1, 2), 10)
            let pav
            let meiopav
            let apart
            let comodo

            if (numpav >= 10) {
                pav = agrupamento.substr(0, 1) + numpav
                meiopav = agrupamento.substr(3, 4)
                apart = agrupamento.substr(7, 1) + '0' + agrupamento.substr(9, 1)
                comodo = agrupamento.substr(10, 1) + '0' + agrupamento.substr(11, 1)
            } else {
                pav = agrupamento.substr(0, 1) + '0' + numpav
                meiopav = agrupamento.substr(2, 4)
                apart = agrupamento.substr(6, 1) + '0' + agrupamento.substr(8, 1)
                comodo = agrupamento.substr(9, 1) + '0' + agrupamento.substr(10, 1)

            }

            firebase.database().ref(`obras/${obra}/sequenciareal/${bloco}/${pav}/${meiopav}/${apart}/${comodo}`).once('value').then(snapshot => {
                var rfId = snapshot.child(parseInt(numero, 10)).val();
                var data = snapshot.child("data").val();
                if (rfId && data) {
                    resolve([rfId, data])
                } else {
                    resolve([null, null])
                }
            });
        }
    });
}

async function getInfoLeituras(data) {
    return await getRfidAndData(data)
}

function getInfoOnlyRfidFirebase(agrupamento, numero) {
    return new Promise(resolve => {
        if (agrupamento && numero) {
            var obra = document.getElementById('obras').value;
            var bloco = document.getElementById('bloco').value;
            let numpav = parseInt(agrupamento.substr(1, 2), 10)
            let pav
            let meiopav
            let apart
            let comodo

            if (numpav >= 10) {
                pav = agrupamento.substr(0, 1) + numpav
                meiopav = agrupamento.substr(3, 4)
                apart = agrupamento.substr(7, 1) + '0' + agrupamento.substr(9, 1)
                comodo = agrupamento.substr(10, 1) + '0' + agrupamento.substr(11, 1)
            } else {
                pav = agrupamento.substr(0, 1) + '0' + numpav
                meiopav = agrupamento.substr(2, 4)
                apart = agrupamento.substr(6, 1) + '0' + agrupamento.substr(8, 1)
                comodo = agrupamento.substr(9, 1) + '0' + agrupamento.substr(10, 1)

            }

            firebase.database().ref(`obras/${obra}/sequenciareal/${bloco}/${pav}/${meiopav}/${apart}/${comodo}`).once('value').then(snapshot => {
                var rfId = snapshot.child(parseInt(numero, 10)).val();
                //console.log(`ref: obras/${obra}/sequenciareal/${bloco}/${pav}/${meiopav}/${apart}/${comodo}`)
                //console.log('rfid: ', rfId)

                if (rfId) {
                    resolve(rfId)
                } else {
                    resolve(null)
                }
            });
        }
    });
}

function getInfoDataFirebase(rfId) {
    return new Promise(resolve => {
        if (rfId) {
            firebase.database().ref(`formas/${rfId}/historico/cadastro`).once('value').then(snapshot => {

                var data = Object.keys(snapshot.val())[0];
                if (data) {
                    resolve(data)
                } else {
                    resolve(null)
                }
            });
        }
    });
}
async function getHistorico(data) {
    console.log('info')
    return await getHistoricoFormas(data)
}

async function getHistoricoFormas(data) {
    var noIssue = true

    for (const value of data) {
        if (value.properties.length >= 4) {
            //console.log('value: ', value)

            let rfid = value.properties[2].displayValue;
            let data = value.properties[3].displayValue;
            if (rfid && data) {
                await getHistoricoDefeitosFormasFirebase(rfid, data).then(response => {
                    value.properties[4] = response ? { displayName: "defeitoData", displayValue: response[0] } : { displayName: "manutencaoData", displayValue: response };
                })
                await getHistoricoManutencaoFormasFirebase(rfid, data).then(response => {
                    value.properties[5] = response ? { displayName: "manutencaoData", displayValue: response[0] } : { displayName: "manutencaoData", displayValue: response };
                })

                //Cor vermelha
                console.log('vlue: ', value)
                if (value.properties[4].displayValue && value.properties[5].displayValue == null) {
                    viewer1.setThemingColor(value.dbId, new THREE.Vector4(1, 0, 0, 1));
                    noIssue = false
                }
                //se tiver data defeito mairo que data manutenção
                //Cor vermelha
                else if (value.properties[4].displayValue > value.properties[5].displayValue) {
                    viewer1.setThemingColor(value.dbId, new THREE.Vector4(1, 0, 0, 1));
                    noIssue = false
                }
                //se tiver data manutenção maior que  data defito
                //Cor verde
                else if (value.properties[4].displayValue < value.properties[5].displayValue) {
                    viewer1.setThemingColor(value.dbId, new THREE.Vector4(0, 1, 0, 1));
                    noIssue = false
                }

            } else {
                value.properties[4] = { displayName: "defeitoData", displayValue: null };
                value.properties[6] = { displayName: "manutencaoData", displayValue: null };
            }


        }
    }

    if (noIssue) {
        alert('Sem registro de defeitos')
    }


    return await data;
    return data;
}

function getHistoricoDefeitosFormasFirebase(rfid, data) {
    return new Promise(resolve => {
        if (rfid) {
            firebase.database().ref('formas/' + rfid + '/historico/defeitos').orderByKey().endAt(data).limitToLast(1).once('value').then(snapshot => {
                var objDefeito = snapshot.val(); //objeto com as informações do defeito
                if (objDefeito) {

                    let data = Object.keys(objDefeito); //indice do vetor de objeto
                    if (data) {
                        resolve(data);
                    } else {
                        resolve(null);
                    }
                } else {
                    resolve(null);
                }
            });

        }
    });
}

function getHistoricoManutencaoFormasFirebase(rfid, data) {
    return new Promise(resolve => {
        if (rfid) {
            firebase.database().ref('formas/' + rfid + '/historico/manutencao').orderByKey().endAt(data).limitToLast(1).once('value').then(snapshot => {
                var objManutencao = snapshot.val(); //objeto com as informações do manutenção
                if (objManutencao) {
                    let data = Object.keys(objManutencao); //indice do vetor de objeto
                    resolve(data ? data : null);

                } else {
                    resolve(null)
                }
            });

        }
    });
}