class PanelInfoViewerExtension extends Autodesk.Viewing.Extension {
    constructor(viewer, options) {
        super(viewer, options);
        this._group = null;
        this._button = null;
    }

    load() {
        console.log('PanelInfoViewerExtensions has been loaded');
        return true;
    }

    unload() {
        // Clean our UI elements if we added any
        if (this._group) {
            this._group.removeControl(this._button);
            if (this._group.getNumberOfControls() === 0) {
                this.viewer.toolbar.removeControl(this._group);
            }
        }
        console.log('PanelInfoViewerExtensions has been unloaded');
        return true;
    }

    onToolbarCreated() {
        // Create a new toolbar group if it doesn't exist
        this._group = this.viewer.toolbar.getControl('nestedViewerExtensionToolbar');
        if (!this._group) {
            this._group = new Autodesk.Viewing.UI.ControlGroup('nestedViewerExtensionToolbar');
            this.viewer.toolbar.addControl(this._group);
        }
        var mypanel = null;
        // Add a new button to the toolbar group
        this._button = new Autodesk.Viewing.UI.Button('PanelInfoViewerExtensionButton');
        this._button.onClick = (ev) => {

            if (mypanel != null) {
                //NOP_VIEWER.container.removeChild( mypanel.container );
                mypanel.uninitialize();
                mypanel = null;
                this._button.removeClass('active');

            }
            var actualViewer

            var tipo = document.querySelector('[aria-selected="true"]').textContent;
            if (tipo == "Tempo Real") {
                actualViewer = viewer

            } else {
                actualViewer = viewer1
            }



            var content = document.createElement('div');
            mypanel = new SimplePanel(actualViewer.container, 'mypanel-' + actualViewer.clientContainer.id, 'Dashboard', content, 20, 20);
            mypanel.setVisible(true);
            this._button.addClass('active');
            $('.docking-panel-close').on('click touchstart', function() {

                $('#mypanel-' + actualViewer.clientContainer.id).hide()
            })

            actualViewer.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, function selectionChangedShowNewPanel() {
                if (mypanel != null) {
                    //NOP_VIEWER.container.removeChild( mypanel.container );
                    mypanel.uninitialize();
                    mypanel = null;

                }
                var actualViewer
                var tipo = document.querySelector('[aria-selected="true"]').textContent;
                if (tipo == "Tempo Real") {
                    actualViewer = viewer

                } else {
                    actualViewer = viewer1
                }



                var content = document.createElement('div');
                mypanel = new SimplePanel(actualViewer.container, 'mypanel-' + actualViewer.clientContainer.id, 'Dashboard', content, 20, 20);
                mypanel.setVisible(true);

                $('.docking-panel-close').on('click touchstart', function() {

                    $('#mypanel-' + actualViewer.clientContainer.id).hide()
                    actualViewer.removeEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, selectionChangedShowNewPanel);
                })



            });

        };
        this._button.setToolTip('Informações das Formas');
        this._button.addClass('PanelInfoViewerExtensionIcon');
        this._group.addControl(this._button);
    }
}

Autodesk.Viewing.theExtensionManager.registerExtension('PanelInfoViewerExtension', PanelInfoViewerExtension);


SimplePanel = function(parentContainer, id, title, content, x, y) {
    this.content = content;
    Autodesk.Viewing.UI.DockingPanel.call(this, parentContainer, id, title, '');

    // Auto-fit to the content and don't allow resize.  Position at the coordinates given.
    //
    this.container.style.height = "400px";
    // this.container.style.width = "auto";
    this.container.style.width = "450px";
    this.container.style.resize = "auto";
    this.container.style.left = x + "px";
    this.container.style.top = y + "px";
    this.container.style.zIndex = 2;
    this.container.classList.add('docking-panel-container-solid-color-a');


};

SimplePanel.prototype = Object.create(Autodesk.Viewing.UI.DockingPanel.prototype);
SimplePanel.prototype.constructor = SimplePanel;

SimplePanel.prototype.initialize = function() {
    this.title = this.createTitleBar(this.titleLabel || this.container.id);
    this.container.appendChild(this.title);

    this.container.appendChild(this.content);
    this.initializeMoveHandlers(this.container);


    this.closer = this.createCloseButton();
    this.container.appendChild(this.closer);

    this.footer = this.createFooter();
    this.container.appendChild(this.footer);

    var op = { left: false, heightAdjustment: 100, marginTop: 0 };
    this.scrollcontainer = this.createScrollContainer(op);

    var selection
        // Get current selection

    var tipo = document.querySelector('[aria-selected="true"]').textContent;
    if (tipo == "Tempo Real") {
        selection = viewer.getSelection();
    } else {
        selection = viewer1.getSelection();
    }
    //const selection = viewer.getSelection();
    // viewer.clearSelection();
    var numRfid = null;
    var numForma = null;
    var agrupamento = null;
    var caracteristicas = null;
    var dados = getInfo(selection).then((info => {
            agrupamento = info[0];
            numForma = info[1];

            if (!agrupamento && !numForma) {
                var html = [
                    '<div class="uicomponent-panel-controls-container">',
                    '<div class="">',
                    '<table class="table table-borderlesstable-responsive" id = "clashresultstable">',
                    '<tbody>',
                    '<tr><td>Selecione uma forma!</td></tr>',
                    '</tbody>',
                    '</table>',
                    '</div>',
                    '</div>'
                ].join('\n');
                $(this.scrollContainer).append(html);

                this.initializeMoveHandlers(this.title);
            }

            var rfid = getRfid(agrupamento, numForma).then((dadosNumRfid => {
                //numRfid = info;
                var numRfid = dadosNumRfid[0]
                var progress = dadosNumRfid[1]

                if (!progress) {
                    progress = 0
                }
                if (!numRfid) {
                    var html = [
                        '<div class="uicomponent-panel-controls-container">',
                        '<div class="">',
                        '<table class="table table-borderlesstable-responsive" id = "clashresultstable">',
                        '<tbody>',
                        '<tr><td>Sem informações disponíveis no momento.</td></tr>',
                        '</tbody>',
                        '</table>',
                        '</div>',
                        '</div>'
                    ].join('\n');
                    $(this.scrollContainer).append(html);

                    this.initializeMoveHandlers(this.title);
                }
                var objeto = getCaracteristicas(numRfid).then((objCaracteristicas => {
                    caracteristicas = {
                        nome: objCaracteristicas.nome,
                        altura: objCaracteristicas.altura,
                        espessura: objCaracteristicas.espessura,
                        largura: objCaracteristicas.largura,
                        peso: objCaracteristicas.peso,
                        dataUltimoDefeito: objCaracteristicas.dataUltimoDefeito ? objCaracteristicas.dataUltimoDefeito : 'Sem Registro',
                        descUltimoDefeito: objCaracteristicas.descUltimoDefeito ? objCaracteristicas.descUltimoDefeito : 'Sem Registro',
                        dataUltimaManutencao: objCaracteristicas.dataUltimaManutencao ? objCaracteristicas.dataUltimaManutencao : 'Sem Registro',
                        descUltimaManutencao: objCaracteristicas.descUltimaManutencao ? objCaracteristicas.descUltimaManutencao : 'Sem Registro',
                    }
                    if (!dados || !numRfid || !caracteristicas) {
                        html = [
                            '<div class="uicomponent-panel-controls-container">',
                            '<div class="">',
                            '<table class="table table-borderlesstable-responsive" id = "clashresultstable">',
                            '<tbody>',
                            '<tr><td>Sem informações disponíveis no momento.</td></tr>',
                            '</tbody>',
                            '</table>',
                            '</div>',
                            '</div>'
                        ].join('\n');
                    } else {
                        var html = [
                            '<div class="uicomponent-panel-controls-container">',
                            '<div class="">',
                            '<table class="table table-borderlesstable-responsive" id = "clashresultstable">',
                            '<tbody>',
                            '<tr><td>Name</td><td> ' + caracteristicas.nome + '</td></tr>',
                            `<tr><td>Progresso</td><td><div class="progress">  <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width: ${progress}%;" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100">${progress}%</div></div></td></tr>`,
                            '<tr><td>ID</td><td>' + selection + '</td></tr>',
                            '<tr><td>Agrupamento</td><td>' + agrupamento + '</td></tr>',
                            '<tr><td>Nº RFID</td><td>' + (numRfid.substr(0, 3) == "000" ? numRfid.substr(10) : numRfid) + '</td></tr>',
                            '<tr><td>Largura</td><td>' + caracteristicas.largura + '</td></tr>',
                            '<tr><td>Altura</td><td>' + caracteristicas.altura + '</td></tr>',
                            '<tr><td>Espessura</td><td>' + caracteristicas.espessura + '</td></tr>',
                            '<tr><td>Peso</td><td>' + caracteristicas.peso + '</td></tr>',
                            '<tr><td>Ultimo Registro de Defeito</td><td>' + caracteristicas.dataUltimoDefeito + '</td></tr>',
                            '<tr><td>Defeito</td><td>' + caracteristicas.descUltimoDefeito + '</td></tr>',
                            '<tr><td>Ultimo Registro de Manutenção</td><td>' + caracteristicas.dataUltimaManutencao + '</td></tr>',
                            '<tr><td>Manutenção</td><td>' + caracteristicas.descUltimaManutencao + '</td></tr>',
                            '</tbody>',
                            '</table>',
                            '</div>',
                            '</div>'
                        ].join('\n');
                    }

                    $(this.scrollContainer).append(html);

                    this.initializeMoveHandlers(this.title);
                }))
            }));
        })
        // .catch((error) => console.error('ERR! Houve um erro! ->', error));
    );


    // .catch((error) => console.error('ERR! Houve um erro! ->', error));


};

function getAllLeafComponents(viewer, callback) {
    var cbCount = 0; // count pending callbacks
    var components = []; // store the results
    var tree; // the instance tree

    function getLeafComponentsRec(parent) {
        cbCount++;
        if (tree.getChildCount(parent) != 0) {
            tree.enumNodeChildren(parent, function(children) {
                getLeafComponentsRec(children);
            }, false);
        } else {
            components.push(parent);
        }
        if (--cbCount == 0) callback(components);
    }

    viewer.getObjectTree(function(objectTree) {
        tree = objectTree;
        var allLeafComponents = getLeafComponentsRec(tree.getRootId());
    });
}

async function getAgrupamento(selection) {
    return new Promise(function(resolve) {
        if (selection) {
            getAllLeafComponents(viewer, (dbIds) => {
                dbIds.forEach((dbId) => {
                    if (dbId == selection) {
                        viewer.getProperties(dbId, (props) => {
                            for (let elemento of props.properties) {
                                if (elemento.displayName == "Agrupamento") {
                                    var agrupamento = elemento.displayValue;
                                    resolve(agrupamento);
                                }
                            }
                        })
                    }

                })
            })
        }
    })
}

async function getNumero(selection) {
    return new Promise(function(resolve) {
        if (selection) {
            getAllLeafComponents(viewer, (dbIds) => {
                dbIds.forEach((dbId) => {
                    if (dbId == selection) {
                        viewer.getProperties(dbId, (props) => {
                            for (let elemento of props.properties) {
                                if (elemento.displayName == "Numeração") {
                                    var numeroForma = elemento.displayValue;
                                    resolve(numeroForma);
                                }
                            }
                        })
                    }

                })
            })
        }
    })
}


async function getInfo(selection) {
    let info = [await getAgrupamento(selection), await getNumero(selection)];
    return info;
}

function getInfoRfid(agrupamento, numero) {
    return new Promise(function(resolve) {
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
            //console.log(`${pav}/${meiopav}/${apart}/${comodo}`);
            var vetorBlocos = 0

            firebase.database().ref(`obras/${obra}`).once('value').then(snapshot => {
                //-----------------------
                let identificacao = ""
                snapshot.child(`sequenciareal/${bloco}`).forEach(function(pavimento) {
                    pavimento.forEach((meiopavimento) => {
                        //Identifica se os meio pavimento em construção
                        vetorBlocos++;
                    })


                });
                var progress = 100 * (vetorBlocos / (parseInt(snapshot.child('info/pavimentos').val(), 10) * parseInt(snapshot.child('info/setor').val(), 10)))

                //-----------

                //console.log('progress: ', progress)



                var rfId = snapshot.child(`sequenciareal/${bloco}/${pav}/${meiopav}/${apart}/${comodo}/${parseInt(numero, 10)}`).val();
                resolve([rfId, progress]);
            });
        }

    });
}

async function getRfid(agrupamento, numero) {
    let dadosNumRfid = await getInfoRfid(agrupamento, numero);
    return dadosNumRfid;
}

function getInfoRfidFirebase(numRfid) {
    return new Promise(function(resolve) {
        if (numRfid) {
            firebase.database().ref('formas').once('value').then(snapshot => {
                var obj = snapshot.child(numRfid).val();
                var objDefeito = snapshot.child(numRfid).child('ultimodefeito').val();
                var objManutencao = snapshot.child(numRfid).child('ultimamanutencao').val();
                var caracteristicas = {
                    nome: obj.nome,
                    altura: obj.altura,
                    espessura: obj.espessura,
                    largura: obj.largura,
                    peso: obj.peso,
                    dataUltimoDefeito: (objDefeito) ? objDefeito.data : 'Sem Registro',
                    descUltimoDefeito: (objDefeito) ? objDefeito.defeito : 'Sem Registro',
                    dataUltimaManutencao: (objManutencao) ? objManutencao.datafim : 'Sem Registro',
                    descUltimaManutencao: (objManutencao) ? objManutencao.reparo : 'Sem Registro'

                }

                resolve(caracteristicas);
            });
        }

    });
}

async function getCaracteristicas(numRfid) {
    let objCaracteristicas = await getInfoRfidFirebase(numRfid);
    return objCaracteristicas;
}