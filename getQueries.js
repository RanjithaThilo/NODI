let routerDoc = require('express').Router();
routerDoc.all('/', function (req, response)
{
	var myQueries = {
			"queries": 
			{
				"front" :  
				[
					{"fq1": "Author names: Please confirm if the author names are presented accurately and in the correct sequence (given name, middle  name/initial, family name). Author 1 Given name: [specify authors given name] Last name [specify authors last name]. Also, kindly confirm the details in the metadata are correct."},
					{"fq2": "Article title: Kindly check and confirm the edit made in the title. "},
					{"fq3": "Affiliations: Journal instruction requires a city and country for affiliations; however, these are missing in affiliation [specify affiliation number]. Please verify if the provided city and country are correct and amend if necessary."},
					{"fq4": "Author details: As per journal standard instruction, full names are needed and not just initials. Please provide the complete names for author [specify author name]."},
					{"fq5": "Please check and confirm that the authors and their respective affiliations have been correctly identified and amend if necessary."},
					{"fq6": "Author details: Kindly check and confirm whether the mail ID [specify the mail ID] should also appear in the proof."},
					{"fq7": "Author details: Kindly check and confirm whether the corresponding author is correctly identified and amend if necessary."},
					{"fq8": "Affiliations: Author X had no affiliation in the manuscript. We have tagged affiliation 1 to that author. Please check and confirm."},
					{"fq9": "Affiliations: Affiliation [specify original affiliation] has been split into two different affiliations. Please check if action taken is appropriate and amend if necessary."},
					{"fq10": "Please provide professional degrees (e.g., PhD, MD) for the authors."},
					{"fq11": "Please provide author biography and photo (Query accordingly)."},
					{"fq12": "Abstract: The abstract was not included in the manuscript; however, this is required as per journal standard instruction. The abstract text provided in the PDF was used instead. Kindly advise if action taken is correct."},
					{"fq13": "Abstract: Journal standard instruction requires an unstructured abstract; however, none was provided. Please provide a short abstract of up to 350 words, giving a description of the findings of your article."},
					{"fq14": "Abstract: Journal standard instruction requires a structured abstract; however, none was provided. Please supply an Abstract with subsections “supply required Abstract sections separated by ;”."},
					{"fq15": "As keywords are mandatory for this journal, please provide 3-6 keywords."},
					{"fq16": "Please provide MSC codes. For more details, if required, kindly visit http://www.ams.org/msc/."},
					{"fq17": "Please provide JEL codes. For more details, if required, kindly visit http://www.aeaweb.org/jel/guide/jel.php."},
					{"fq18": "Please provide PACS codes. For more details, if required, kindly visit http://www.aip.org/pacs."}
				],
				"body"  :  
				[
					{"boq1":"Electronic supplementary material ***FILL ACCORDINGLY*** is cited but not provided. Kindly check and provide the same."},
					{"boq2":"URL: Please check if the following URLs are working: [specify URLs separated by;]. Otherwise, please provide alternatives."},
					{"boq3":"Figure: A figure must have a descriptive title; however, none was provided for Figure [specify figure number]. Please supply a title for the said figure."},
					{"boq4":"Figure: Figure [specify figure number] was received; however, no citation was provided in the manuscript. Please check and confirm the inserted citation of Fig/Table is correct. If not, please suggest an alternative citation. Please note that figures and tables should be cited in ascending numerical order in the text. and should be inside the main body of the text."},
					{"boq5":"Figure: Upon checking, it was noticed that there are panels inside the image of Figure [specify figure number]; however, they were not explained in the corresponding caption. Please mention the panels within the figure caption to correspond with the image."},
					{"boq6":"Figure: Upon checking, it was noticed that there are panels in the caption of Figure [specify figure number]; however, they were not found in the corresponding image. Please provide us with an updated figure with corresponding panels matching their description in the figure caption."},
					{"boq7":"Figure: Please note that figures cannot be composed of text only. Since it is in a table format, please modify Figure [specify figure number] as a normal table with at least two columns. Please ensure that if there are other tables in the manuscript, affected tables and citations should be renumbered in ascending numerical order."},
					{"boq8":"Please confirm the section headings are correctly identified."},
					{"boq9":"Please note that section heading “Introduction” is added as per journal style."},
					{"boq10":"In which city, state, and country is this company located?"},
					{"boq11":"As per the information provided by the publisher, Fig. ***** will be black and white in print; hence, please confirm whether we can add “colour figure online” to the caption."},
					{"boq12":"Figures: Figure [specify figure number] is poor in quality due to [specify reason c/o Graphics]. Please supply a high-resolution version of the said figure."},
					{"boq13":"Figure: Journal standard requires that the first figure referenced in the manuscript text should be Figure 1, the second, Figure 2, etc. However, the original sequence of figure citations [specify original sequence] is out of order. Figure images and citations were reordered so that they are cited in consecutive order. Please check if action taken is appropriate. Otherwise, kindly advise us on how to proceed."},
					{"boq14":"Table: Table [specify table number] was received; however, no citation was provided in the manuscript. Please provide the location of where to insert the citation in the main body of the text. Otherwise, kindly advise us on how to proceed. Please note that tables should be cited in ascending numerical order in the main body of the text."},
					{"boq15":"Table: Journal standard requires that the first table referenced in the manuscript text should be Table 1, the second, Table 2, etc. However, the original sequence of table citations [specify original sequence] is out of order. Tables and citations were reordered so that they are cited in consecutive numerical order. Please check if action taken is appropriate. Otherwise, kindly advise us on how to proceed."},
					{"boq16":"Table: A table caption must have a descriptive title; however, none was provided for Table [specify table number]. Please supply a title for the said table."},
					{"boq17":"Table: Please provide the corresponding indication of the footnote [specify text on footnote] inside Table [specify table number]. Otherwise, kindly amend if deemed necessary."},
					{"boq18":"Table: Please specify the significance of the symbol [specify kind of symbol] reflected inside Table [specify table number] by providing a description in the form of a table footnote. Otherwise, kindly amend if deemed necessary."},
					{"boq19":"As References ** and ** are same, we have deleted the duplicate reference and renumbered accordingly. Please check and confirm."},
					{"boq20":"Equation: As per journal standards, the numbering of equations should be in ascending numerical order; hence, equations [specify original sequence] were renumbered accordingly. Please check if action is appropriate."},
					{"boq21":"Kindly check and confirm the edit in the sentence “... ... ...” in page ***FILL ACCORDINGLY*** of the manuscript."},
					{"boq22":"Is the word _____________ spelled correctly? Please check, and amend if necessary."},
					{"boq23":"Is this the correct expansion of []? Please check, and correct if necessary."},
					{"boq24":"Please check the edit(s) made in Eq. (__), and correct if necessary."},
					{"boq25":"Please check the italicization of genes, and correct if necessary."},
					{"boq26":"The given sentence seems to be incomplete. Please check for missing words/phrases and complete the sentence."},
					{"boq27":"This sentence has been slightly modified for clarity. Please check that the meaning is still correct, and amend if  necessary."},
					{"boq28":"Please provide a definition for the significance of [bold, italics, underline, letter a, asterisk] in the table."},
					{"boq29":"Please check the layout of Table(s) __, and correct if necessary."},
					{"boq30":"As per Springer style, the ESM figures/tables should be numbered separately and not along with the text figures.  Hence, we  have renumbered the text figures/tables as per style. Please note and provide us an updated ESM with figures/tables separately."},
					{"boq31":"Please note that Eqs. ---- have been rekeyed as they were in picture format (or) not converted properly."}
				],
				"back"  :  
				[
					{"baq1":"Ethical approval: Any experimental research that is reported in the manuscript should have been performed with the approval of an appropriate ethics committee. Research carried out on humans must be in compliance with the Helsinki Declaration, and any experimental research on animals should follow internationally recognized guidelines. A statement to this effect must appear in the manuscript, including the name of the body which gave approval, with a reference number where appropriate. In this regard, please provide the missing information to comply with standard requirements."},
					{"baq2":"Reference: Reference [**FILL REFERENCE NUMBER**] was mentioned in the manuscript; however, this was not included in the reference list. As a rule, all mentioned references should be present in the reference list. Please provide the reference details to be inserted in the reference list and ensure that all references are cited in ascending numerical order"},
					{"baq3":"Reference: Reference [**FILL REFERENCE NUMBER**] was provided in the reference list; however, this was not mentioned or cited in the manuscript. As a rule, if a citation is present in the text, then it should be present in the list. Please provide the location of where to insert the reference citation in the main body text. Kindly ensure that all references are cited in ascending numerical order."},
					{"baq4":"Reference: Reference (**FILL NAME AND YEAR**) was mentioned in the manuscript; however, this was not included in the reference list. As a rule, all mentioned references should be present in the reference list. Please provide the reference details to be inserted in the reference list."},
					{"baq5":"Reference: Reference (**FILL NAME AND YEAR**) was provided in the reference list; however, this was not mentioned or cited in the manuscript. As a rule, if a citation is present in the text, then it should be present in the list. Please provide the location of where to insert the reference citation in the main body text."},
					{"baq6":"Reference: All references must be numbered in ascending order, in square brackets; however, the original sequence of reference citations [__-__] is out of order. All affected reference citations were renumbered including their corresponding references in the reference list. Please check if action taken is appropriate. Otherwise, kindly advise us on how to proceed. "},
					{"baq7":"Competing interests/Conflict of interests (**MENTION ACCORDINGLY**): Journal instruction requires a Competing interests section; however, none was provided. The authors are required to complete a declaration of competing interests. All competing interests that are declared will be listed before the references. In this regard, please provide the missing section."},
					{"baq8":"Additional file/Supplementary file (**MENTION ACCORDINGLY**): Additional file [specify additional file number] was mentioned in the manuscript; however, no e-file was provided. Please supply the e-file of the mentioned additional file. Otherwise, kindly advise us on how to proceed."},
					{"baq9":"The citation ____ has been changed to match the author name/date in the reference list. Please check here and in subsequent  occurrences, and correct if necessary."},
					{"baq10":"Please supply the year of publication for Ref ****."},
					{"baq11":"Please supply the name of the publisher for Ref ****."},
					{"baq12":"Please provide full journal titles for references []."},
					{"baq13":"Please check the abbreviated journal titles in references."},
					{"baq14":"The reference citation “Name [***FILL ACCORDINGLY***]” does not match with the list. Please check and change accordingly."},
					{"baq15":"Please update Ref. ***FILL ACCORDINGLY*** with ***FILL ACCORDINGLY***."},
					{"baq16":"Kindly check whether the reference ***** is correct."},
					{"baq17":"10396 -- Please provide abstract with headings such as “Purpose, Methods, Results, Conclusion”."}
				]
			}
		};
		response.send(JSON.stringify(myQueries));
});
module.exports = routerDoc;