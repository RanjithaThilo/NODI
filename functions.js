let xpath = require('xpath'), dom = require('xmldom').DOMParser;
var xmlescape = require('xml-escape');

module.exports =
	{
		nameToLowerCase: function (name) {
			return name.toLowerCase();
		},
		escapeHtml: function (value) {
			return unescape(value.trim());

		},
		getAllother: function (doc, elementList) {
			var xml = '';
			elementList.forEach(function (ele) {
				xml += (xpath.select("//" + ele, doc).length) ? xpath.select("//" + ele, doc).toString() : "<" + ele + "> </" + ele + ">";
			})
			return xml;
		},
		tagProcess: function (xml) {
			xml = xml.replace(/\n/g, '');
			xml = xml.replace(/\t/g, '');
			xml = xml.replace(/\s{2,}/g, '');
			xml = xml.replace(/<strong>/ig, 'boldopen');
			xml = xml.replace(/<b>/ig, 'boldopen');
			xml = xml.replace(/<em>/ig, 'emopen');
			xml = xml.replace(/<i>/ig, 'emopen');
			xml = xml.replace(/<\/strong>/ig, 'boldclose');
			xml = xml.replace(/<\/b>/ig, 'boldclose');
			xml = xml.replace(/<\/em>/ig, 'emclose');
			xml = xml.replace(/<\/i>/ig, 'emclose');
			xml = xml.replace(/\\ufeff/ig, "");
			return xml;
		},
		replaceTag: function (val) {
			val = val.replace(/boldopen/ig, '<b>');
			val = val.replace(/emopen/ig, '<i>');
			val = val.replace(/boldclose/ig, '</b>');
			val = val.replace(/emclose/ig, '</i>');
			val = val.replace(/<check>/ig, '');
			val = val.replace(/<\/check>/ig, '');
			return val;
		},
		getElement: function (doc, element, tag, childList) {
			var xml = '';
			if (xpath.select("//" + element + "/" + tag, doc).length) {
				var node = xpath.select("//" + element + "/" + tag, doc)
				node.forEach(function (element) {
					var innerDom = new dom().parseFromString(element.toString());
					xml += "<" + tag + ">";
					childList.forEach(function (InnerTag) {
						xml += (xpath.select("//" + tag + "/" + InnerTag, innerDom).length) ? xpath.select("//" + tag + "/" + InnerTag, innerDom).toString().replace(/>,/g, '>') : "<" + InnerTag + "></" + InnerTag + ">";
					});
					xml += "</" + tag + ">";
				})
			}
			else {
				xml += "<" + tag + ">";
				childList.forEach(function (tag) {
					xml += "<" + tag + "></" + tag + ">";
				});
				xml += "</" + tag + ">";
			}
			return xml;
		},
		removeEmptyElement: function (parsedJson, bibtype, bibNode, tag) {
			if (parsedJson[bibtype][bibNode][0][tag] !== undefined) {
				var condition = parsedJson[bibtype][bibNode][0][tag][0]['#'];
				if (condition == undefined || condition == ' ' || condition == '') {
					delete parsedJson[bibtype][bibNode][0][tag];
				}
			}
			return parsedJson;
		},

		escapeElements: function (element, doc , bibtype) {
			var data = xpath.select('//' + element, doc);
			if (data[0] != null) {
				var content = data[0].toString();
				if (element == 'articletitle') {
					content = content.replace(/\<articletitle[^>]+\>/g, "");
					content = content.replace(/\<\/articletitle\>/g, "");
				}
				if (element == 'booktitle' && bibtype == 'bibchapter') {
					content = content.replace(/\<booktitle\>/g, "");
					content = content.replace(/\<\/booktitle\>/g, "");
				}
				if (element == 'booktitle' && bibtype == 'bibbook') {
					content = content.replace(/\<booktitle[^>]+\>/g, "");
					content = content.replace(/\<\/booktitle\>/g, "");
				}
				if (element == 'chaptertitle') {
					content = content.replace(/\<chaptertitle[^>]+\>/g, "");
					content = content.replace(/\<\/chaptertitle\>/g, "");
				}
				if (element == 'journaltitle') {
					content = content.replace(/\<journaltitle\>/g, "");
					content = content.replace(/\<\/journaltitle\>/g, "");
				}
				content = xmlescape(content);
				var textNode = doc.createTextNode(content);
				var newartciletitle = doc.createElement(element);
				if(bibtype == 'bibbook'){
					if (element == 'articletitle' || element == 'booktitle' || element == 'chaptertitle') {
						newartciletitle.setAttribute('language', data[0].getAttribute('language'));
					}
				}else {
					if (element == 'articletitle' || element == 'chaptertitle') {
						newartciletitle.setAttribute('language', data[0].getAttribute('language'));
					}
				}
			
				newartciletitle.appendChild(textNode);
				doc.replaceChild(newartciletitle, data[0]);
				doc = new dom().parseFromString(doc.toString());
				return doc;
			} else {
				return doc;
			}

		},

		// createEle: function (element, doc) {
		// 	if (element == 'etal') {
		// 		var etalval = xpath.select("string(//etal)", doc);
		// 		if (etalval == 'Yes') {
		// 			var textNode = doc.createTextNode(etalval);
		// 		} else {
		// 			var textNode = doc.createTextNode('No');
		// 		}

		// 		var etal = doc.createElement('etal');
		// 		etal.appendChild(textNode);
		// 		return etal;
		// 	}
		// 	else if ((element == 'articletitle') || (element == 'booktitle') || (element == 'chaptertitle')) {
		// 		var artdoc = xpath.select("//" + element, doc);
		// 		var content = artdoc[0].toString();
		// 		var regex = new RegExp('\<*' + element + '[^>]*\>', 'g');
		// 		content = content.replace(regex, "");
		// 		var textNode = doc.createTextNode(content);
		// 		var articletitle = doc.createElement(element);
		// 		articletitle.setAttribute('language', artdoc[0].getAttribute('language'))
		// 		articletitle.appendChild(textNode);
		// 		return articletitle;
		// 	} else {
		// 		var data = xpath.select("string(//" + element + ")", doc);
		// 		var textNode = doc.createTextNode(data);
		// 		var creEle = doc.createElement(element);
		// 		creEle.appendChild(textNode);
		// 		return creEle;
		// 	}

		// },

		clistructure: function (parsedJson, bibtype) {
			var item = [];
			if (bibtype == 'bibarticle') {
				type = "article-journal";
				title = parsedJson.citation.bibarticle[0].articletitle[0]['#'];
				containertitle = parsedJson.citation.bibarticle[0].journaltitle[0]['#'];
			} else if (bibtype == 'bibchapter') {
				type = "chapter";
				containertitle = parsedJson.citation.bibchapter[0].booktitle[0]['#'];
				title = parsedJson.citation.bibchapter[0].chaptertitle[0]['#'];
				publisher = parsedJson.citation.bibchapter[0].publishername[0]['#'];
				publisher_place = parsedJson.citation.bibchapter[0].publisherlocation[0]['#']
				bibeditorname = [];
				for (var i = 0; i < parsedJson.citation.bibchapter[0].bibeditorname.length; i++) {
					initails = parsedJson.citation.bibchapter[0].bibeditorname[i].initials[0]['#'];
					familyname = parsedJson.citation.bibchapter[0].bibeditorname[i].familyname[0]['#'];
					bibeditorname.push({ "given": initails, "family": familyname });
				}
			} else {
				type = "book";
				title = parsedJson.citation.bibbook[0].booktitle[0]['#'];
				publisher = parsedJson.citation.bibbook[0].publishername[0]['#'];
				publisher_place = parsedJson.citation.bibbook[0].publisherlocation[0]['#']
			}
			bibauthorname = [];
			for (var i = 0; i < parsedJson.citation[bibtype][0].bibauthorname.length; i++) {
				initails = parsedJson.citation[bibtype][0].bibauthorname[i].initials[0]['#'];
				familyname = parsedJson.citation[bibtype][0].bibauthorname[i].familyname[0]['#'];
				bibauthorname.push({ "given": initails, "family": familyname });
			}
			etal = parsedJson.citation[bibtype][0].etal[0]['#'];
			year = parsedJson.citation[bibtype][0].year[0]['#'];
			volume = parsedJson.citation[bibtype][0].volumeid[0]['#'];
			firstpage = parsedJson.citation[bibtype][0].firstpage[0]['#'];
			lastpage = parsedJson.citation[bibtype][0].lastpage[0]['#'];
			if (bibtype == 'bibarticle') {
				item.push({
					"id": parsedJson.citation['@'].id, "type": type, "author": bibauthorname, "etal": etal, "title": title,
					"container-title": containertitle, "issued": { "raw": year },
					"volume": volume, "page": firstpage + "-" + lastpage,
				});
			} else if (bibtype == 'bibchapter') {
				item.push({
					"id": parsedJson.citation['@'].id, "type": type, "author": bibauthorname, "etal": etal, "title": title,
					"container-title": containertitle, "issued": { "raw": year }, "editor": bibeditorname,
					"volume": volume, "page": firstpage + "-" + lastpage, "publisher": publisher, "publisher-place": publisher_place
				});

			} else {
				item.push({
					"id": parsedJson.citation['@'].id, "type": type, "author": bibauthorname, "etal": etal, "title": title,
					"issued": { "raw": year },
					"volume": volume, "page": firstpage + "-" + lastpage, "publisher": publisher, "publisher-place": publisher_place
				});
			}
			return item;
		},
		replacexml: function (xml, type) {
			var xml = xml.replace(/<sample>/g, '');
			xml = xml.replace(/&amp;nbsp;/g, ' ');
			xml = xml.replace(/citation/, 'div class="Citation"');
			xml = xml.replace(/Language/g, 'language');
			xml = xml.replace(/<\/sample>/g, '');
			xml = xml.replace(/<\/citation>/, '</div>');
			xml = xml.replace(/\n/g, '');
			xml = xml.replace(/&lt;/g, '<');
			xml = xml.replace(/&gt;/g, '>');
			xml = xml.replace(/\s{2,}/g, '');
			xml = xml.replace(/<bibarticle>/, '<div class=\"BibStructured\"><bibarticle>');
			xml = xml.replace(/<bibbook>/, '<div class=\"BibStructured\"><bibbook>');
			xml = xml.replace(/<bibchapter>/, '<div class=\"BibStructured\"><bibchapter>');
			xml = xml.replace(/<bibunstructured>/, '<div class=\"BibUnstructured\">');
			xml = xml.replace(/<\/bibarticle>/, '</bibarticle></div>');
			xml = xml.replace(/<\/bibbook>/, '</bibbook></div>');
			xml = xml.replace(/<\/bibchapter>/, '</bibchapter></div>');
			xml = xml.replace(/<\/bibunstructured>/, '</div>');
			xml = xml.replace(/<initials><\/initials>/ig, '<noinitials><\/noinitials>');
			xml = xml.replace(/<articletitle language="En"><\/articletitle>/, '/<noarticletitle><\/noarticletitle>');
			console.log('type', type);
			if (type != 0 || type != '') {
				xml = xml.replace(/<type>/, '<span name="CitationNumber" class="EditNotAllowed" title="Label Editing not allowed">');
				xml = xml.replace(/<\/type>/, '. </span>');
			}
			return xml;
		}


	};
