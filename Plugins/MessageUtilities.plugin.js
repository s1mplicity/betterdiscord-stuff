//META{"name":"MessageUtilities","authorId":"278543574059057154","invite":"Jx3TjNS","donate":"https://www.paypal.me/MircoWittrien","patreon":"https://www.patreon.com/MircoWittrien","website":"https://github.com/mwittrien/BetterDiscordAddons/tree/master/Plugins/MessageUtilities","source":"https://raw.githubusercontent.com/mwittrien/BetterDiscordAddons/master/Plugins/MessageUtilities/MessageUtilities.plugin.js"}*//

var MessageUtilities = (_ => {
	var firedEvents = [];
	var clickMap = ["CLICK", "DBLCLICK"];
	
	return class MessageUtilities {
		getName () {return "MessageUtilities";}

		getVersion () {return "1.7.2";}

		getAuthor () {return "DevilBro";}

		getDescription () {return "Offers a number of useful message options. Remap the keybindings in the settings.";}

		constructor () {
			this.changelog = {
				"fixed":[["Open React Menu","Works again"]]
			};
			
			this.patchedModules = {
				after: {
					ContextMenuItem: "default"
				}
			};
		}

		initConstructor () {
			this.defaults = {
				settings: {
					"addHints":					{value:true, 	description:"Add keycombo hints to contextmenus:"},
					"clearOnEscape":			{value:true, 	description:"Clear chat input when Escape is pressed:"}
				},
				toasts: {},
				bindings: {
					"Edit_Message":				{name:"Edit Message",			func:this.doEdit,			value:{click:1, 	keycombo:[]}		},
					"Delete_Message":			{name:"Delete Message",			func:this.doDelete,			value:{click:0, 	keycombo:[46]}		},
					"Pin/Unpin_Message":		{name:"Pin/Unpin Message",		func:this.doPinUnPin,		value:{click:0, 	keycombo:[17]}		},
					"React_to_Message":			{name:"Open React Menu",		func:this.doOpenReact,		value:{click:0, 	keycombo:[17,83]}	},
					"Copy_Raw":					{name:"Copy raw Message",		func:this.doCopyRaw,		value:{click:0, 	keycombo:[17,68]}	},
					"Copy_Link":				{name:"Copy Message Link",		func:this.doCopyLink,		value:{click:0, 	keycombo:[17,81]}	},
					"Quote_Message":			{name:"Quote Message",			func:this.doQuote,			value:{click:0, 	keycombo:[17,87]}	},
					"__Note_Message":			{name:"Note Message",			func:this.doNote,			value:{click:0, 	keycombo:[16]}, 	plugin:"PersonalPins"},
					"__Translate_Message":		{name:"Translate Message",		func:this.doTranslate,		value:{click:0, 	keycombo:[20]}, 	plugin:"GoogleTranslateOption"},
					"__Reveal_Spoilers":		{name:"Reveal All Spoilers",	func:this.doReveal,			value:{click:0, 	keycombo:[17,74]}, 	plugin:"RevealAllSpoilersOption"}
				}
			};
			for (let type in this.defaults.bindings) {
				let nativeaction = type.indexOf("__") != 0;
				this.defaults.settings[type] = {value:nativeaction};
				if (nativeaction) this.defaults.toasts[type] = {value:type != "Edit_Message" && type != "React_to_Message" && type != "Quote_Message"};
			}
		}

		getSettingsPanel () {
			if (!window.BDFDB || typeof BDFDB != "object" || !BDFDB.loaded || !this.started) return;
			let settings = BDFDB.DataUtils.get(this, "settings");
			let bindings = BDFDB.DataUtils.get(this, "bindings");
			let toasts = BDFDB.DataUtils.get(this, "toasts");
			let settingsPanel, settingsItems = [];
			
			for (let key in settings) if (this.defaults.settings[key].description) settingsItems.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsSaveItem, {
				className: BDFDB.disCN.marginbottom8,
				type: "Switch",
				plugin: this,
				keys: ["settings", key],
				label: this.defaults.settings[key].description,
				value: settings[key]
			}));
			settingsItems.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.FormComponents.FormDivider, {
				className: BDFDB.disCN.marginbottom8
			}));
			for (let action in bindings) if (!this.defaults.bindings[action].plugin || BDFDB.BDUtils.isPluginEnabled(this.defaults.bindings[action].plugin)) {
				settingsItems.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.Flex, {
					className: BDFDB.disCN.marginbottom8,
					align: BDFDB.LibraryComponents.Flex.Align.CENTER,
					direction: BDFDB.LibraryComponents.Flex.Direction.HORIZONTAL,
					children: [
						BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsLabel, {
							label: this.defaults.bindings[action].name + (this.defaults.bindings[action].plugin ? ` (${this.defaults.bindings[action].plugin})` : "")
						}),
						toasts[action] != undefined ? BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsSaveItem, {
							type: "Switch",
							mini: true,
							plugin: this,
							keys: ["toasts", action],
							grow: 0,
							label: "Toast:",
							value: toasts[action]
						}) : null
					].filter(n => n)
				}));
				settingsItems.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsSaveItem, {
					className: BDFDB.disCN.marginbottom8,
					type: "Switch",
					dividerbottom: true,
					mini: true,
					plugin: this,
					keys: ["settings", action],
					value: settings[action],
					labelchildren: BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.Flex, {
						direction: BDFDB.LibraryComponents.Flex.Direction.HORIZONTAL,
						children: [
							BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.KeybindRecorder, {
								defaultValue: bindings[action].keycombo.filter(n => n),
								reset: true,
								onChange: keycombo => {
									bindings[action].keycombo = keycombo;
									BDFDB.DataUtils.save(bindings, this, "bindings");
								}
							}),
							BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.Select, {
								value: bindings[action].click,
								options: clickMap.map((label, i) => {return {value:i, label:label}}),
								onChange: choice => {
									bindings[action].click = choice.value;
									BDFDB.DataUtils.save(bindings, this, "bindings");
								}
							})
						]
					})
				}));
			}
			settingsItems.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsItem, {
				type: "Button",
				className: BDFDB.disCN.marginbottom8,
				color: BDFDB.LibraryComponents.Button.Colors.RED,
				label: "Reset all Key Bindings",
				onClick: (e, instance) => {
					BDFDB.ModalUtils.confirm(this, "Are you sure you want to reset all Key Bindings?", _ => {
						BDFDB.DataUtils.remove(this, "bindings");
						settingsPanel.parentElement.appendChild(this.getSettingsPanel());
						settingsPanel.remove();
					});
				},
				children: BDFDB.LanguageUtils.LanguageStrings.RESET
			}));
			
			return settingsPanel = BDFDB.PluginUtils.createSettingsPanel(this, settingsItems);
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
				
				BDFDB.ListenerUtils.add(this, document, "click", BDFDB.dotCN.message, e => {
					this.onClick(e, 0, "onSglClick");
				});
				BDFDB.ListenerUtils.add(this, document, "dblclick", BDFDB.dotCN.message, e => {
					this.onClick(e, 1, "onDblClick");
				});
				BDFDB.ListenerUtils.add(this, document, "keydown", e => {
					if (BDFDB.DOMUtils.getParent(BDFDB.dotCN.textareawrapchat, document.activeElement)) this.onKeyDown(document.activeElement, e.which, "onKeyDown");
				});
			}
			else console.error(`%c[${this.getName()}]%c`, "color: #3a71c1; font-weight: 700;", "", "Fatal Error: Could not load BD functions!");
		}

		stop () {
			if (window.BDFDB && typeof BDFDB === "object" && BDFDB.loaded) {
				this.stopping = true;

				BDFDB.PluginUtils.clear(this);
			}
		}


		//begin of own functions
		
		processContextMenuItem (e) {
			if (e.instance.props.label && !e.instance.props.hint && BDFDB.DataUtils.get(this, "settings", "addHints")) {
				let hint, action;
				if (e.instance.props.label == BDFDB.LanguageUtils.LanguageStrings.MARK_UNREAD) hint = `${clickMap[0]}+${BDFDB.LibraryModules.KeyCodeUtils.getString(18)}`;
				else {
					switch (e.instance.props.label) {
						case BDFDB.LanguageUtils.LanguageStrings.COPY_MESSAGE_LINK:
							action = "Copy_Link";
							break;
						case BDFDB.LanguageUtils.LanguageStrings.EDIT_MESSAGE:
							action = "Edit_Message";
							break;
						case BDFDB.LanguageUtils.LanguageStrings.PIN_MESSAGE:
						case BDFDB.LanguageUtils.LanguageStrings.UNPIN_MESSAGE:
							action = "Pin/Unpin_Message";
							break;
						case BDFDB.LanguageUtils.LanguageStrings.DELETE_MESSAGE:
							action = "Delete_Message";
							break;
						case BDFDB.LanguageUtils.LanguageStrings.QUOTE:
							action = "Quote_Message";
							break;
					}
					if (action) hint = this.getActiveShortcutString(action);
				}
				if (hint) {
					let [children, index] = BDFDB.ReactUtils.findChildren(e.returnvalue, {props: [["className", BDFDB.disCN.contextmenuhint]]});
					if (index > -1) children[index] = BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.ContextMenuItems.Hint, {hint});
				}
			}
		}

		onClick (e, click, name) {
			if (!firedEvents.includes(name)) {
				firedEvents.push(name);
				let settings = BDFDB.DataUtils.get(this, "settings");
				let bindings = BDFDB.ObjectUtils.filter(BDFDB.DataUtils.get(this, "bindings"), action => {return settings[action]}, true);
				let priorityaction = null;
				for (let action in bindings) {
					let binding = bindings[action];
					let prioritybinding = bindings[priorityaction];
					if (this.checkIfBindingIsValid(binding, click) && (!bindings[priorityaction] || binding.click > prioritybinding.click || binding.keycombo.length > prioritybinding.keycombo.length)) priorityaction = action;
				}
				if (priorityaction) {
					let {messagediv, message} = this.getMessageData(e.currentTarget);
					if (messagediv && message) {
						BDFDB.ListenerUtils.stopEvent(e);
						BDFDB.TimeUtils.clear(this.clickTimeout);
						if (!this.hasDoubleClickOverwrite(bindings, bindings[priorityaction])) {
							this.defaults.bindings[priorityaction].func.apply(this, [{messagediv, message}, priorityaction]);
						}
						else this.clickTimeout = BDFDB.TimeUtils.timeout(_ => {
							this.defaults.bindings[priorityaction].func.apply(this, [{messagediv, message}, priorityaction]);
						}, 500);
					}
				}
				BDFDB.TimeUtils.timeout(_ => {BDFDB.ArrayUtils.remove(firedEvents, name, true)});
			}
		}

		checkIfBindingIsValid (binding, doneclick) {
			let valid = true;
			if (binding.click != doneclick) valid = false;
			for (let key of binding.keycombo) if (!BDFDB.InternalData.pressedKeys.includes(key)) valid = false;
			return valid;
		}

		hasDoubleClickOverwrite (bindings, binding) {
			if (binding.click == 1) return false;
			let dblbindings = BDFDB.ObjectUtils.filter(bindings, bndg => {return bndg.click == 1});
			for (let dblaction in dblbindings) {
				let dblbndg = dblbindings[dblaction];
				let overwrite = true;
				if (BDFDB.equals(binding.keycombo, dblbndg.keycombo)) return true;
			}
			return false;
		}

		doDelete ({messagediv, message}, action) {
			let deletelink = messagediv.parentElement.querySelector(BDFDB.dotCNS.messagelocalbotoperations + BDFDB.dotCN.anchor);
			if (deletelink) deletelink.click();
			else {
				let channel = BDFDB.LibraryModules.ChannelStore.getChannel(message.channel_id);
				if ((channel && BDFDB.UserUtils.can("MANAGE_MESSAGES")) || message.author.id == BDFDB.UserUtils.me.id && message.type != 1 && message.type != 2 && message.type != 3) {
					BDFDB.LibraryModules.MessageUtils.deleteMessage(message.channel_id, message.id, message.state != "SENT");
					if (BDFDB.DataUtils.get(this, "toasts", action)) BDFDB.NotificationUtils.toast("Message has been deleted.", {type:"success"});
				}
			}
		}

		doEdit ({messagediv, message}, action) {
			if (message.author.id == BDFDB.UserUtils.me.id && !messagediv.querySelector("textarea")) {
				BDFDB.LibraryModules.MessageUtils.startEditMessage(message.channel_id, message.id, message.content);
				if (BDFDB.DataUtils.get(this, "toasts", action)) BDFDB.NotificationUtils.toast("Started editing.", {type:"success"});
			}
		}

		doOpenReact ({messagediv, message}, action) {
			let reactButton = messagediv.querySelector(`${BDFDB.dotCN.messagetoolbarbutton}[aria-label="${BDFDB.LanguageUtils.LanguageStrings.ADD_REACTION}"]`);
			if (reactButton) {
				reactButton.click();
				if (BDFDB.DataUtils.get(this, "toasts", action)) BDFDB.NotificationUtils.toast("Reaction popout has been opened.", {type:"success"});
			}
		}

		doPinUnPin ({messagediv, message}, action) {
			if (message.state == "SENT") {
				let channel = BDFDB.LibraryModules.ChannelStore.getChannel(message.channel_id);
				if (channel && (channel.type == 1 || channel.type == 3 || BDFDB.UserUtils.can("MANAGE_MESSAGES")) && message.type == 0) {
					if (message.pinned) {
						BDFDB.LibraryModules.MessagePinUtils.unpinMessage(channel, message.id);
						if (BDFDB.DataUtils.get(this, "toasts", action)) BDFDB.NotificationUtils.toast("Message has been unpinned.", {type:"error"});
					}
					else {
						BDFDB.LibraryModules.MessagePinUtils.pinMessage(channel, message.id);
						if (BDFDB.DataUtils.get(this, "toasts", action)) BDFDB.NotificationUtils.toast("Message has been pinned.", {type:"success"});
					}
				}
			}
		}

		doCopyRaw ({messagediv, message}, action) {
			if (message.content) {
				BDFDB.LibraryRequires.electron.clipboard.write({text:message.content});
				if (BDFDB.DataUtils.get(this, "toasts", action)) BDFDB.NotificationUtils.toast("Raw message content has been copied.", {type:"success"});
			}
		}

		doCopyLink ({messagediv, message}, action) {
			let channel = BDFDB.LibraryModules.ChannelStore.getChannel(message.channel_id);
			if (channel) {
				BDFDB.LibraryRequires.electron.clipboard.write({text:`https://discordapp.com/channels/${channel.guild_id || BDFDB.DiscordConstants.ME}/${channel.id}/${message.id}`});
				if (BDFDB.DataUtils.get(this, "toasts", action)) BDFDB.NotificationUtils.toast("Messagelink has been copied.", {type:"success"});
			}
		}

		doQuote ({messagediv, message}, action) {
			let channel = BDFDB.LibraryModules.ChannelStore.getChannel(message.channel_id);
			if (channel && BDFDB.LibraryModules.QuoteUtils.canQuote(message, channel)) {
				BDFDB.LibraryModules.DispatchUtils.ComponentDispatch.dispatch(BDFDB.DiscordConstants.ComponentActions.INSERT_QUOTE_TEXT, {
					text: BDFDB.LibraryModules.QuoteUtils.createQuotedText(message, channel)
				});
				if (BDFDB.DataUtils.get(this, "toasts", action)) BDFDB.NotificationUtils.toast("Quote has been created.", {type:"success"});
			}
		}

		doNote ({messagediv, message}, action) {
			if (BDFDB.BDUtils.isPluginEnabled(this.defaults.bindings.__Note_Message.plugin)) {
				let channel = BDFDB.LibraryModules.ChannelStore.getChannel(message.channel_id);
				if (channel) BDFDB.BDUtils.getPlugin(this.defaults.bindings.__Note_Message.plugin).addMessageToNotes(message, channel);
			}
		}

		doTranslate ({messagediv, message}, action) {
			if (BDFDB.BDUtils.isPluginEnabled(this.defaults.bindings.__Translate_Message.plugin)) {
				let channel = BDFDB.LibraryModules.ChannelStore.getChannel(message.channel_id);
				if (channel) BDFDB.BDUtils.getPlugin(this.defaults.bindings.__Translate_Message.plugin).translateMessage(message, channel);
			}
		}

		doReveal ({messagediv, message}, action) {
			if (BDFDB.BDUtils.isPluginEnabled(this.defaults.bindings.__Reveal_Spoilers.plugin)) {
				BDFDB.BDUtils.getPlugin(this.defaults.bindings.__Reveal_Spoilers.plugin).revealAllSpoilers(messagediv);
			}
		}

		onKeyDown (target, key, name) {
			if (!firedEvents.includes(name)) {
				firedEvents.push(name);
				if (key == 27 && BDFDB.DataUtils.get(this, "settings", "clearOnEscape")) {
					let chatform = BDFDB.DOMUtils.getParent(BDFDB.dotCN.chatform, target);
					if (chatform) {
						let instance = BDFDB.ReactUtils.findOwner(chatform, {name:"ChannelTextAreaForm"}) || BDFDB.ReactUtils.findOwner(chatform, {name:"ChannelTextAreaForm", up:true});
						if (instance) instance.setState({textValue:"", richValue:BDFDB.LibraryModules.SlateUtils.deserialize("")});
					}
				}
				BDFDB.TimeUtils.timeout(_ => {BDFDB.ArrayUtils.remove(firedEvents, name, true)});
			}
		}

		getActiveShortcutString (action) {
			if (!action) return null;
			let str = "", settings = BDFDB.DataUtils.get(this, "settings");
			if (settings.addHints && settings[action]) {
				let binding = BDFDB.DataUtils.get(this, "bindings", action);
				if (binding) {
					str += clickMap[binding.click];
					if (binding.keycombo.length) str += " + " + BDFDB.LibraryModules.KeyCodeUtils.getString(binding.keycombo);
				}
			}
			return str.replace(/ /g, "");
		}

		getMessageData (target) {
			let messagediv = BDFDB.DOMUtils.getParent(BDFDB.dotCN.message, target);
			if (messagediv && messagediv.querySelector(BDFDB.dotCN.textarea)) return {messagediv: null, message: null};
			let instance = BDFDB.ReactUtils.getInstance(messagediv);
			let message = instance && BDFDB.ReactUtils.findValue(instance, "message");
			return {messagediv, message};
		}
	}
})();
