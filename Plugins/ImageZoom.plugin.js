﻿//META{"name":"ImageZoom","authorId":"278543574059057154","invite":"Jx3TjNS","donate":"https://www.paypal.me/MircoWittrien","patreon":"https://www.patreon.com/MircoWittrien","website":"https://github.com/mwittrien/BetterDiscordAddons/tree/master/Plugins/ImageZoom","source":"https://raw.githubusercontent.com/mwittrien/BetterDiscordAddons/master/Plugins/ImageZoom/ImageZoom.plugin.js"}*//

var ImageZoom = (_ => {
	return class ImageZoom {
		getName () {return "ImageZoom";}

		getVersion () {return "1.1.2";}

		getAuthor () {return "DevilBro";}

		getDescription () {return "Allows you to zoom in opened Images by holding left clicking on them in the Image Modal.";}

		constructor () {
			this.changelog = {
				"fixed":[["Styling && Functionality","Fixed the style for the new image modal layout"]]
			};

			this.patchedModules = {
				after: {
					ImageModal: ["render", "componentDidMount"],
					LazyImage: "componentDidMount"
				}
			};
		}

		initConstructor () {
			this.css = `
				${BDFDB.dotCN._imagezoomlense} {
					border: 2px solid rgb(114, 137, 218);
				}
				${BDFDB.dotCN._imagezoomoperations} {
					position: absolute;
				}
				${BDFDB.dotCNS._imagezoomoperations + BDFDB.dotCN.downloadlink} {
					position: relative !important;
				}
				${BDFDB.dotCNS._imagezoomoperations + BDFDB.dotCN.anchor + BDFDB.dotCN.downloadlink} {
					margin: 0 !important;
				}
			`;

			this.defaults = {
				settings: {
					zoomlevel:		{value:2,		digits:1,		edges:[1, 10],		unit:"x",	label:"ACCESSIBILITY_ZOOM_LEVEL_LABEL"},
					lensesize:		{value:200,		digits:0,		edges:[50, 1000],	unit:"px",	label:"context_lensesize_text"}
				}
			};
		}

		// Legacy
		load () {}

		start () {
			if (!window.BDFDB) window.BDFDB = {myPlugins:{}};
			if (window.BDFDB && window.BDFDB.myPlugins && typeof window.BDFDB.myPlugins == "object") window.BDFDB.myPlugins[this.getName()] = this;
			let libraryScript = document.querySelector("head script#BDFDBLibraryScript");
			if (!libraryScript || (performance.now() - libraryScript.getAttribute("date")) > 600000) {
				if (libraryScript) libraryScript.remove();
				libraryScript = document.createElement("script");
				libraryScript.setAttribute("id", "BDFDBLibraryScript");
				libraryScript.setAttribute("type", "text/javascript");
				libraryScript.setAttribute("src", "https://mwittrien.github.io/BetterDiscordAddons/Plugins/BDFDB.min.js");
				libraryScript.setAttribute("date", performance.now());
				libraryScript.addEventListener("load", _ => {this.initialize();});
				document.head.appendChild(libraryScript);
			}
			else if (window.BDFDB && typeof BDFDB === "object" && BDFDB.loaded) this.initialize();
			this.startTimeout = setTimeout(_ => {
				try {return this.initialize();}
				catch (err) {console.error(`%c[${this.getName()}]%c`, "color: #3a71c1; font-weight: 700;", "", "Fatal Error: Could not initiate plugin! " + err);}
			}, 30000);
		}

		initialize () {
			if (window.BDFDB && typeof BDFDB === "object" && BDFDB.loaded) {
				if (this.started) return;
				BDFDB.PluginUtils.init(this);

				BDFDB.ModuleUtils.forceAllUpdates(this);
			}
			else console.error(`%c[${this.getName()}]%c`, "color: #3a71c1; font-weight: 700;", "", "Fatal Error: Could not load BD functions!");
		}

		stop () {
			if (window.BDFDB && typeof BDFDB === "object" && BDFDB.loaded) {
				this.stopping = true;

				BDFDB.ModuleUtils.forceAllUpdates(this);

				BDFDB.PluginUtils.clear(this);
			}
		}


		// Begin of own functions

		processImageModal (e) {
			if (e.returnvalue) {
				let [children, index] = BDFDB.ReactUtils.findChildren(e.returnvalue, {props: [["className", BDFDB.disCN.downloadlink]]});
				if (index > -1) {
					let openContext = event => {
						let settings = BDFDB.DataUtils.get(this, "settings");
						BDFDB.ContextMenuUtils.open(this, event, BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.ContextMenuItems.Group, {
							children: Object.keys(settings).map(type => BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.ContextMenuItems.Slider, {
								defaultValue: settings[type],
								digits: this.defaults.settings[type].digits,
								edges: this.defaults.settings[type].edges,
								renderLabel: value => {
									return (this.labels[this.defaults.settings[type].label] || BDFDB.LanguageUtils.LanguageStrings[this.defaults.settings[type].label]) + ": " + value + this.defaults.settings[type].unit;
								},
								onValueRender: value => {
									return value + this.defaults.settings[type].unit;
								},
								onValueChange: value => {
									BDFDB.DataUtils.save(value, this, "settings", type);
								}
							}))
						}));
					};
					children[index] = BDFDB.ReactUtils.createElement("span", {
						className: BDFDB.disCN._imagezoomoperations,
						children: [
							children[index],
							BDFDB.ReactUtils.createElement("span", {
								className: BDFDB.disCN.downloadlink,
								children: "|",
								style: {margin: "0 5px"}
							}),
							BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.Anchor, {
								className: BDFDB.disCN.downloadlink, 
								children: `Zoom ${BDFDB.LanguageUtils.LanguageStrings.SETTINGS}`,
								onClick: openContext,
								onContextMenu: openContext
							})
						],
					});
				}
			}
			if (e.node) BDFDB.DOMUtils.addClass(BDFDB.DOMUtils.getParent(BDFDB.dotCN.modal, e.node), BDFDB.disCN._imagezoomimagemodal);
		}

		processLazyImage (e) {
			if (!BDFDB.DOMUtils.containsClass(e.node.parentElement, BDFDB.disCN._imagegallerysibling) && BDFDB.ReactUtils.findOwner(BDFDB.DOMUtils.getParent(BDFDB.dotCNC.modal + BDFDB.dotCN.layermodal, e.node), {name: "ImageModal"})) {
				e.node.addEventListener("mousedown", event => {
					BDFDB.ListenerUtils.stopEvent(event);

					let imgRects = BDFDB.DOMUtils.getRects(e.node.firstElementChild);
					let settings = BDFDB.DataUtils.get(this, "settings");

					let lense = BDFDB.DOMUtils.create(`<div class="${BDFDB.disCN._imagezoomlense}" style="clip-path: circle(${(settings.lensesize/2) + 2}px at center) !important; border-radius: 50% !important; pointer-events: none !important; z-index: 10000 !important; width: ${settings.lensesize}px !important; height: ${settings.lensesize}px !important; position: fixed !important;"><div style="position: absolute !important; top: 0 !important; right: 0 !important; bottom: 0 !important; left: 0 !important; clip-path: circle(${settings.lensesize/2}px at center) !important;"><${e.node.firstElementChild.tagName} src="${e.instance.props.src}" style="width: ${imgRects.width * settings.zoomlevel}px; height: ${imgRects.height * settings.zoomlevel}px; position: fixed !important;"${e.node.firstElementChild.tagName == "VIDEO" ? " loop autoplay" : ""}></${e.node.firstElementChild.tagName}></div></div>`);
					let pane = lense.firstElementChild.firstElementChild;
					let backdrop = BDFDB.DOMUtils.create(`<div class="${BDFDB.disCN._imagezoombackdrop}" style="background: rgba(0, 0, 0, 0.3) !important; position: absolute !important; top: 0 !important; right: 0 !important; bottom: 0 !important; left: 0 !important; pointer-events: none !important; z-index: 8000 !important;"></div>`);
					let appMount = document.querySelector(BDFDB.dotCN.appmount);
					appMount.appendChild(lense);
					appMount.appendChild(backdrop);

					let lenserects = BDFDB.DOMUtils.getRects(lense), panerects = BDFDB.DOMUtils.getRects(pane);
					let halfW = lenserects.width / 2, halfH = lenserects.height / 2;
					let minX = imgRects.left, maxX = minX + imgRects.width;
					let minY = imgRects.top, maxY = minY + imgRects.height;
					lense.style.setProperty("left", event.clientX - halfW + "px", "important");
					lense.style.setProperty("top", event.clientY - halfH + "px", "important");
					pane.style.setProperty("left", imgRects.left + ((settings.zoomlevel - 1) * (imgRects.left - event.clientX)) + "px", "important");
					pane.style.setProperty("top", imgRects.top + ((settings.zoomlevel - 1) * (imgRects.top - event.clientY)) + "px", "important");

					let dragging = event2 => {
						let x = event2.clientX > maxX ? maxX - halfW : event2.clientX < minX ? minX - halfW : event2.clientX - halfW;
						let y = event2.clientY > maxY ? maxY - halfH : event2.clientY < minY ? minY - halfH : event2.clientY - halfH;
						lense.style.setProperty("left", x + "px", "important");
						lense.style.setProperty("top", y + "px", "important");
						pane.style.setProperty("left", imgRects.left + ((settings.zoomlevel - 1) * (imgRects.left - x - halfW)) + "px", "important");
						pane.style.setProperty("top", imgRects.top + ((settings.zoomlevel - 1) * (imgRects.top - y - halfH)) + "px", "important");
					};
					let releasing = _ => {
						document.removeEventListener("mousemove", dragging);
						document.removeEventListener("mouseup", releasing);
						BDFDB.DOMUtils.remove(lense, backdrop);
					};
					document.addEventListener("mousemove", dragging);
					document.addEventListener("mouseup", releasing);
				});
			}
		}

		setLabelsByLanguage () {
			switch (BDFDB.LanguageUtils.getLanguage().id) {
				case "hr":		//croatian
					return {
						context_lensesize_text:				"Veličina leće"
					};
				case "da":		//danish
					return {
						context_lensesize_text:				"Linsestørrelse"
					};
				case "de":		//german
					return {
						context_lensesize_text:				"Linsengröße"
					};
				case "es":		//spanish
					return {
						context_lensesize_text:				"Tamaño de la lente"
					};
				case "fr":		//french
					return {
						context_lensesize_text:				"Taille de la lentille"
					};
				case "it":		//italian
					return {
						context_lensesize_text:				"Dimensione dell'obiettivo"
					};
				case "nl":		//dutch
					return {
						context_lensesize_text:				"Lensgrootte"
					};
				case "no":		//norwegian
					return {
						context_lensesize_text:				"Linsestørrelse"
					};
				case "pl":		//polish
					return {
						context_lensesize_text:				"Rozmiar obiektywu"
					};
				case "pt-BR":	//portuguese (brazil)
					return {
						context_lensesize_text:				"Tamanho da lente"
					};
				case "fi":		//finnish
					return {
						context_lensesize_text:				"Linssin koko"
					};
				case "sv":		//swedish
					return {
						context_lensesize_text:				"Linsstorlek"
					};
				case "tr":		//turkish
					return {
						context_lensesize_text:				"Lens boyutu"
					};
				case "cs":		//czech
					return {
						context_lensesize_text:				"Velikost objektivu"
					};
				case "bg":		//bulgarian
					return {
						context_lensesize_text:				"Размер на обектива"
					};
				case "ru":		//russian
					return {
						context_lensesize_text:				"Размер объектива"
					};
				case "uk":		//ukrainian
					return {
						context_lensesize_text:				"Розмір об'єктива"
					};
				case "ja":		//japanese
					return {
						context_lensesize_text:				"Розмір об'єктива"
					};
				case "zh-TW":	//chinese (traditional)
					return {
						context_lensesize_text:				"鏡片尺寸"
					};
				case "ko":		//korean
					return {
						context_lensesize_text:				"렌즈 크기"
					};
				default:		//default: english
					return {
						context_lensesize_text:				"Lense Size"
					};
			}
		}
	}
})();