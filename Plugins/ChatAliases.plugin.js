//META{"name":"ChatAliases","authorId":"278543574059057154","invite":"Jx3TjNS","donate":"https://www.paypal.me/MircoWittrien","patreon":"https://www.patreon.com/MircoWittrien","website":"https://github.com/mwittrien/BetterDiscordAddons/tree/master/Plugins/ChatAliases","source":"https://raw.githubusercontent.com/mwittrien/BetterDiscordAddons/master/Plugins/ChatAliases/ChatAliases.plugin.js"}*//

var ChatAliases = (_ => {
	return class ChatAliases {
		getName () {return "ChatAliases";}

		getVersion () {return "2.1.2";}

		getAuthor () {return "DevilBro";}

		getDescription () {return "Allows the user to configure their own chat-aliases which will automatically be replaced before the message is being sent.";}

		constructor () {
			this.changelog = {
				"fixed":[["Left over placeholder","Sending a an aliases for a file upload without any other text no longer leaves the message in the textarea"]]
			};
			
			this.patchedModules = {
				before: {
					ChannelAutoComplete: "render",
					ChannelTextAreaForm: "render",
					MessageEditor: "render",
					Upload: "render"
				}
			};
		}

		initConstructor () {
			this.css = `
				${BDFDB.dotCN.autocompleteicon} {
					flex: 0 0 auto;
				}
			`;
			
			this.defaults = {
				configs: {
					case: 		{value:false,		description:"Handle the wordvalue case sensitive"},
					exact: 		{value:true,		description:"Handle the wordvalue as an exact word and not as part of a word"},
					autoc: 		{value:true,		description:"Add this alias in the autocomplete menu (not for RegExp)"},
					regex: 		{value:false,		description:"Handle the wordvalue as a RegExp string"},
					file: 		{value:false,		description:"Handle the replacevalue as a filepath"}
				},
				settings: {
					addContextMenu:		{value:true, 	description:"Add a ContextMenu entry to faster add new Aliases:"},
					addAutoComplete:	{value:true, 	description:"Add an Autocomplete-Menu for Non-RegExp Aliases:"}
				},
				amounts: {
					minAliasLength:		{value:2, 		min:1,	description:"Minimal Character Length to open Autocomplete-Menu:"}
				}
			};
		}

		getSettingsPanel (collapseStates = {}) {
			if (!window.BDFDB || typeof BDFDB != "object" || !BDFDB.loaded || !this.started) return;
			let settings = BDFDB.DataUtils.get(this, "settings");
			let amounts = BDFDB.DataUtils.get(this, "amounts");
			let settingsPanel, settingsItems = [], innerItems = [];
			
			for (let key in settings) innerItems.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsSaveItem, {
				className: BDFDB.disCN.marginbottom8,
				type: "Switch",
				plugin: this,
				keys: ["settings", key],
				label: this.defaults.settings[key].description,
				value: settings[key]
			}));
			for (let key in amounts) innerItems.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsSaveItem, {
				className: BDFDB.disCN.marginbottom8,
				type: "TextInput",
				childProps: {
					type: "number"
				},
				plugin: this,
				keys: ["amounts", key],
				label: this.defaults.amounts[key].description,
				basis: "20%",
				min: this.defaults.amounts[key].min,
				max: this.defaults.amounts[key].max,
				value: amounts[key]
			}));
			settingsItems.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.CollapseContainer, {
				title: "Settings",
				collapseStates: collapseStates,
				children: innerItems
			}));
			let values = {wordvalue:"", replacevalue:""};
			settingsItems.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.CollapseContainer, {
				title: "Add new Alias",
				collapseStates: collapseStates,
				dividertop: true,
				children: [
					BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsItem, {
						type: "Button",
						label: "Pick a Wordvalue and Replacevalue:",
						key: "ADDBUTTON",
						disabled: !Object.keys(values).every(valuename => values[valuename]),
						children: BDFDB.LanguageUtils.LanguageStrings.ADD,
						onClick: _ => {
							this.saveWord(values.wordvalue, values.replacevalue, settingsPanel.querySelector(".input-replacevalue input[type='file']"));
							BDFDB.PluginUtils.refreshSettingsPanel(this, settingsPanel, collapseStates);
						}
					}),
					this.createInputs(values)
				].flat(10).filter(n => n)
			}));
			if (!BDFDB.ObjectUtils.isEmpty(this.aliases)) settingsItems.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.CollapseContainer, {
				title: "Added Aliases",
				collapseStates: collapseStates,
				dividertop: true,
				children: BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsList, {
					settings: Object.keys(this.defaults.configs),
					data: Object.keys(this.aliases).map((wordvalue, i) => Object.assign({}, this.aliases[wordvalue], {
						key: wordvalue,
						label: wordvalue
					})),
					renderLabel: data => BDFDB.ReactUtils.createElement("div", {
						style: {width: "100%"},
						children: [
							BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.TextInput, {
								value: data.label,
								placeholder: data.label,
								size: BDFDB.LibraryComponents.TextInput.Sizes.MINI,
								maxLength: 100000000000000000000,
								onChange: value => {
									this.aliases[value] = this.aliases[data.label];
									delete this.aliases[data.label];
									data.label = value;
									BDFDB.DataUtils.save(this.aliases, this, "words");
								}
							}),
							BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.TextInput, {
								value: data.replace,
								placeholder: data.replace,
								size: BDFDB.LibraryComponents.TextInput.Sizes.MINI,
								maxLength: 100000000000000000000,
								onChange: value => {
									this.aliases[data.label].replace = value;
									BDFDB.DataUtils.save(this.aliases, this, "words");
								}
							})
						]
					}),
					onCheckboxChange: (value, instance) => {
						this.aliases[instance.props.cardId][instance.props.settingId] = value;
						BDFDB.DataUtils.save(this.aliases, this, "words");
					},
					onRemove: (e, instance) => {
						delete this.aliases[instance.props.cardId];
						BDFDB.DataUtils.save(this.aliases, this, "words");
						BDFDB.PluginUtils.refreshSettingsPanel(this, settingsPanel, collapseStates);
					}
				})
			}));
			settingsItems.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.CollapseContainer, {
				title: "Remove All",
				collapseStates: collapseStates,
				dividertop: true,
				children: BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsItem, {
					type: "Button",
					className: BDFDB.disCN.marginbottom8,
					color: BDFDB.LibraryComponents.Button.Colors.RED,
					label: "Remove all added Aliases",
					onClick: _ => {
						BDFDB.ModalUtils.confirm(this, "Are you sure you want to remove all added Aliases?", _ => {
							this.aliases = {};
							BDFDB.DataUtils.remove(this, "words");
							BDFDB.PluginUtils.refreshSettingsPanel(this, settingsPanel, collapseStates);
						});
					},
					children: BDFDB.LanguageUtils.LanguageStrings.REMOVE
				})
			}));
			settingsItems.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.CollapseContainer, {
				title: "Config Guide",
				collapseStates: collapseStates,
				dividertop: true,
				children: ["Case: Will replace words while comparing lowercase/uppercase. apple => apple, not APPLE or AppLe", "Not Case: Will replace words while ignoring lowercase/uppercase. apple => apple, APPLE and AppLe", "Exact: Will replace words that are exactly the replaceword. apple to pear => applepie stays applepie", "Not Exact: Will replace words anywhere they appear. apple to pear => applepieapple to pearpiepear", "Autoc: Will appear in the Autocomplete Menu (if enabled).", ["Regex: Will treat the entered wordvalue as a regular expression. ", BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.Anchor, {href: "https://regexr.com/", children: BDFDB.LanguageUtils.LanguageStrings.HELP + "?"})] , "File: If the replacevalue is a filepath it will try to upload the file located at the filepath."].map(string => BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.FormComponents.FormText, {
					type: BDFDB.LibraryComponents.FormComponents.FormTextTypes.DESCRIPTION,
					children: string
				}))
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

				this.aliases = BDFDB.DataUtils.load(this, "words");

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

		onSettingsClosed () {
			if (this.SettingsUpdated) {
				delete this.SettingsUpdated;
				BDFDB.ModuleUtils.forceAllUpdates(this);
			}
		}

		onNativeContextMenu (e) {
			if (e.instance.props.value && e.instance.props.value.trim()) {
				if ((e.instance.props.type == "NATIVE_TEXT" || e.instance.props.type == "CHANNEL_TEXT_AREA") && BDFDB.DataUtils.get(this, "settings", "addContextMenu")) this.injectItem(e, e.instance.props.value.trim());
			}
		}

		onSlateContextMenu (e) {
			let text = document.getSelection().toString().trim();
			if (text && BDFDB.DataUtils.get(this, "settings", "addContextMenu")) this.injectItem(e, text);
		}

		onMessageContextMenu (e) {
			let text = document.getSelection().toString().trim();
			if (text && BDFDB.DataUtils.get(this, "settings", "addContextMenu")) this.injectItem(e, text);
		}
	 
		injectItem (e, text) {
			let [children, index] = BDFDB.ReactUtils.findChildren(e.returnvalue, {name:["FluxContainer(MessageDeveloperModeGroup)", "DeveloperModeGroup"]});
			children.splice(index > -1 ? index : children.length, 0, BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.ContextMenuItems.Group, {
				children: BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.ContextMenuItems.Item, {
					label: "Add to ChatAliases",
					action: _ => {
						BDFDB.ContextMenuUtils.close(e.instance);
						this.openAddModal(text.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t"));
					}
				})
			}));
		}

		processChannelAutoComplete (e) {
			let minLength = BDFDB.DataUtils.get(this, "amounts", "minAliasLength");
			e.instance.state.autocompleteOptions.ALIASES = {
				matches: (firstChar, rest, isFirstWord) => {
					let currentLastWord = BDFDB.SlateUtils.getCurrentWord(e.instance.props.editorRef.current).word || "";
					if (currentLastWord.length >= minLength) for (let word in this.aliases) {
						let aliasdata = this.aliases[word];
						if (!aliasdata.regex && aliasdata.autoc) {
							if (aliasdata.exact) {
								if (aliasdata.case && word.indexOf(currentLastWord) == 0) return true;
								else if (!aliasdata.case && word.toLowerCase().indexOf(currentLastWord.toLowerCase()) == 0) return true;
							}
							else {
								if (aliasdata.case && word.indexOf(currentLastWord) > -1) return true;
								else if (!aliasdata.case && word.toLowerCase().indexOf(currentLastWord.toLowerCase()) > -1) return true;
							}
						}
					}
					return false;
				},
				queryResults: (rest) => {
					let currentLastWord = BDFDB.SlateUtils.getCurrentWord(e.instance.props.editorRef.current).word || "";
					let matches = [];
					for (let word in this.aliases) {
						if (matches.length >= BDFDB.DiscordConstants.MAX_AUTOCOMPLETE_RESULTS) break;
						let aliasdata = Object.assign({word}, this.aliases[word]);
						if (!aliasdata.regex && aliasdata.autoc) {
							if (aliasdata.exact) {
								if (aliasdata.case && word.indexOf(currentLastWord) == 0) matches.push(aliasdata);
								else if (!aliasdata.case && word.toLowerCase().indexOf(currentLastWord.toLowerCase()) == 0) matches.push(aliasdata);
							}
							else {
								if (aliasdata.case && word.indexOf(currentLastWord) > -1) matches.push(aliasdata);
								else if (!aliasdata.case && word.toLowerCase().indexOf(currentLastWord.toLowerCase()) > -1) matches.push(aliasdata);
							}
						}
					}
					if (matches.length) return {aliases: matches};
				},
				renderResults: (rest, currentSelected, setSelected, chooseSelected, autocompletes) => {
					return [
						BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.AutocompleteItems.Title, {
							title: [
								"Aliases: ",
								BDFDB.ReactUtils.createElement("strong", {
									children: BDFDB.SlateUtils.getCurrentWord(e.instance.props.editorRef.current).word || ""
								})
							]
						}),
						autocompletes.aliases.map((aliasdata, i) => BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.AutocompleteItems.Generic, {
							onClick: chooseSelected,
							onHover: setSelected,
							index: i,
							selected: currentSelected === i,
							alias: aliasdata,
							text: aliasdata.word,
							description: aliasdata.replace,
						}))
					].flat(10).filter(n => n);
				},
				getPlainText: (eventOrIndex, autocompletes) => {
					let aliasdata = eventOrIndex._targetInst ? eventOrIndex._targetInst.memoizedProps.alias : typeof eventOrIndex == "number" && autocompletes.aliases[eventOrIndex];
					return aliasdata.word;
				},
				getRawText: (eventOrIndex, autocompletes) => {
					let aliasdata = eventOrIndex._targetInst ? eventOrIndex._targetInst.memoizedProps.alias : typeof eventOrIndex == "number" && autocompletes.aliases[eventOrIndex];
					return aliasdata.file ? aliasdata.word : BDFDB.StringUtils.insertNRST(aliasdata.replace);
				}
			};
			if (e.instance.state.autocompleteType == "COMMAND" && BDFDB.ArrayUtils.is(e.instance.state.autocompletes.commands)) {
				for (let i in e.instance.state.autocompletes.commands) if (e.instance.state.autocompletes.commands[i].alias) e.instance.state.autocompletes.commands[i] = null;
				e.instance.state.autocompletes.commands = e.instance.state.autocompletes.commands.filter(n => n);
				let currentLastWord = BDFDB.SlateUtils.getCurrentWord(e.instance.props.editorRef.current).word || "";
				let commandAliases = BDFDB.ObjectUtils.filter(this.aliases, key => key.startsWith("/"), true);
				if (currentLastWord.length >= minLength) for (let word in commandAliases) {
					if (e.instance.state.autocompletes.commands.length >= BDFDB.DiscordConstants.MAX_AUTOCOMPLETE_RESULTS) break;
					let aliasdata = commandAliases[word];
					let command = {command: word.slice(1), description: BDFDB.StringUtils.insertNRST(aliasdata.replace), alias:true};
					if (!aliasdata.regex && aliasdata.autoc) {
						if (aliasdata.exact) {
							if (aliasdata.case && word.indexOf(currentLastWord) == 0) e.instance.state.autocompletes.commands.push(command);
							else if (!aliasdata.case && word.toLowerCase().indexOf(currentLastWord.toLowerCase()) == 0) e.instance.state.autocompletes.commands.push(command);
						}
						else {
							if (aliasdata.case && word.indexOf(currentLastWord) > -1) e.instance.state.autocompletes.commands.push(command);
							else if (!aliasdata.case && word.toLowerCase().indexOf(currentLastWord.toLowerCase()) > -1) e.instance.state.autocompletes.commands.push(command);
						}
					}
				}
			}
		}
		
		processChannelTextAreaForm (e) {
			if (!BDFDB.ModuleUtils.isPatched(this, e.instance, "handleSendMessage")) BDFDB.ModuleUtils.patch(this, e.instance, "handleSendMessage", {before: e2 => {
				this.handleSubmit(e, e2, 0);
			}}, {force: true, noCache: true});
		}
		
		processMessageEditor (e) {
			if (!BDFDB.ModuleUtils.isPatched(this, e.instance, "onSubmit")) BDFDB.ModuleUtils.patch(this, e.instance, "onSubmit", {before: e2 => {
				this.handleSubmit(e, e2, 0);
			}}, {force: true, noCache: true});
		}
		
		processUpload (e) {
			if (!BDFDB.ModuleUtils.isPatched(this, e.instance, "submitUpload")) BDFDB.ModuleUtils.patch(this, e.instance, "submitUpload", {before: e2 => {
				this.handleSubmit(e, e2, 1);
			}}, {force: true, noCache: true});
		}
		
		handleSubmit (e, e2, textIndex) {
			let messageData = this.formatText(e2.methodArguments[textIndex]);
			if (messageData) {
				if (messageData.text != null) {
					e2.methodArguments[textIndex] = messageData.text;
					e.instance.props.textValue = "";
					if (e.instance.props.richValue) e.instance.props.richValue = BDFDB.SlateUtils.copyRichValue("", e.instance.props.richValue);
					if (e.instance.state) {
						e.instance.state.textValue = "";
						if (e.instance.state.richValue) e.instance.state.richValue = BDFDB.SlateUtils.copyRichValue("", e.instance.state.richValue);
					}
					BDFDB.ReactUtils.forceUpdate(e.instance);
				}
				if (messageData.files.length > 0 && (BDFDB.DMUtils.isDMChannel(e.instance.props.channel.id) || BDFDB.UserUtils.can("ATTACH_FILES"))) {
					BDFDB.LibraryModules.UploadUtils.instantBatchUpload(e.instance.props.channel.id, messageData.files);
				}
			}
		}

		formatText (text) {
			text = text.replace(/([\n\t\r])/g, " $1 ");
			var newText = [], files = [], wordAliases = {}, multiAliases = {};
			for (let word in this.aliases) {
				if (!this.aliases[word].regex && word.indexOf(" ") == -1) wordAliases[word] = this.aliases[word];
				else multiAliases[word] = this.aliases[word];
			}
			for (let word of text.trim().split(" ")) {
				newText.push(this.useAliases(word, wordAliases, files, true));
			}
			newText = newText.length == 1 ? newText[0] : newText.join(" ");
			newText = newText.replace(/ ([\n\t\r]) /g, "$1");
			newText = this.useAliases(newText, multiAliases, files, false);
			return {text:newText, files};
		}

		useAliases (string, aliases, files, singleword) {
			for (let word in aliases) {
				let aliasdata = aliases[word];
				let escpAlias = aliasdata.regex ? word : BDFDB.StringUtils.regEscape(word);
				let result = true, replaced = false, tempstring1 = string, tempstring2 = "";
				let regstring = aliasdata.exact ? "^" + escpAlias + "$" : escpAlias;
				while (result != null) {
					result = new RegExp(regstring, (aliasdata.case ? "" : "i") + (aliasdata.exact ? "" : "g")).exec(tempstring1);
					if (result) {
						replaced = true;
						let replace = aliasdata.file ? "" : BDFDB.StringUtils.insertNRST(aliasdata.replace);
						if (result.length > 1) for (let i = 1; i < result.length; i++) replace = replace.replace(new RegExp("\\\\" + i + "|\\$" + i, "g"), result[i]);
						tempstring2 += tempstring1.slice(0, result.index + result[0].length).replace(result[0], replace);
						tempstring1 = tempstring1.slice(result.index + result[0].length);
						if (aliasdata.file && typeof aliasdata.filedata == "string") {
							let filedata = JSON.parse(aliasdata.filedata);
							files.push(new File([Uint8Array.from(atob(filedata.data), c => c.charCodeAt(0))], filedata.name, {type:filedata.type}));
						}
						if (aliasdata.regex && regstring.indexOf("^") == 0) result = null;
					}
					if (!result) tempstring2 += tempstring1;
				}
				if (replaced) {
					string = tempstring2;
					if (singleword) break;
				}
			}
			return string;
		}

		openAddModal (wordvalue) {
			let values = {
				wordvalue,
				replacevalue: ""
			};
			BDFDB.ModalUtils.open(this, {
				size: "MEDIUM",
				header: "Add to ChatAliases",
				subheader: "",
				children: [
					this.createInputs(values),
					BDFDB.ArrayUtils.remove(Object.keys(this.defaults.configs), "file").map(key => BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsItem, {
						type: "Switch",
						className: BDFDB.disCN.marginbottom8 + " input-config" + key,
						label: this.defaults.configs[key].description,
						value: this.defaults.configs[key].value
					}))
				].flat(10).filter(n => n),
				buttons: [{
					key: "ADDBUTTON",
					disabled: !Object.keys(values).every(valuename => values[valuename]),
					contents: BDFDB.LanguageUtils.LanguageStrings.ADD,
					color: "BRAND",
					close: true,
					click: modal => {
						let configs = {};
						for (let key in this.defaults.configs) {
							let configinput = modal.querySelector(`.input-config${key} ${BDFDB.dotCN.switchinner}`);
							if (configinput) configs[key] = configinput.checked;
						}
						this.saveWord(values.wordvalue, values.replacevalue, modal.querySelector(".input-replacevalue input[type='file']"), configs);
					}
				}]
			});
		}
		
		createInputs (values) {
			return [{title:"Replace:", type:"", error:"Choose a Wordvalue", valuename:"wordvalue"}, {title:"With:", type:"file", error:"Choose a Replacevalue", valuename:"replacevalue"}].map(inputdata => BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.FormComponents.FormItem, {
				title: inputdata.title,
				className: BDFDB.disCN.marginbottom8 + " input-" + inputdata.valuename,
				children: BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.TextInput, {
					type: inputdata.type,
					useFileath: inputdata.type == "file",
					value: values[inputdata.valuename],
					placeholder: values[inputdata.valuename],
					autoFocus: inputdata.valuename == "replacevalue",
					errorMessage: !values[inputdata.valuename] && inputdata.error,
					onChange: (value, instance) => {
						values[inputdata.valuename] = value.trim();
						if (values[inputdata.valuename]) delete instance.props.errorMessage;
						else instance.props.errorMessage = inputdata.error;
						let addbuttonins = BDFDB.ReactUtils.findOwner(BDFDB.ReactUtils.findOwner(instance, {name:["BDFDB_Modal", "BDFDB_SettingsPanel"], up:true}), {key:"ADDBUTTON"});
						if (addbuttonins) {
							addbuttonins.props.disabled = !Object.keys(values).every(valuename => values[valuename]);
							BDFDB.ReactUtils.forceUpdate(addbuttonins);
						}
					}
				})
			}));
		}

		saveWord (wordvalue, replacevalue, fileselection, configs = BDFDB.DataUtils.get(this, "configs")) {
			if (!wordvalue || !replacevalue || !fileselection) return;
			var filedata = null;
			if (fileselection.files && fileselection.files[0] && BDFDB.LibraryRequires.fs.existsSync(replacevalue)) {
				filedata = JSON.stringify({
					data: BDFDB.LibraryRequires.fs.readFileSync(replacevalue).toString("base64"),
					name: fileselection.files[0].name,
					type: fileselection.files[0].type
				});
			}
			this.aliases[wordvalue] = {
				replace: replacevalue,
				filedata: filedata,
				case: configs.case,
				exact: wordvalue.indexOf(" ") > -1 ? false : configs.exact,
				autoc: configs.regex ? false : configs.autoc,
				regex: configs.regex,
				file: filedata != null
			};
			BDFDB.DataUtils.save(this.aliases, this, "words");
		}
	}
})();