let CryptoJS = require("crypto-js");
module.exports = 
{
    getCyper: function(ciphertext) 
	{
		ciphertext = (ciphertext.replace(/-/g,'+'));
		ciphertext = (ciphertext.replace(/_/g,'/'));
		var bytes  = CryptoJS.AES.decrypt(ciphertext.toString(), 'WcYk\\AKp');
		var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
		if(JSON.stringify(decryptedData)!='')
		{
			return decryptedData;
		}
		return 0;
	},
	getEncrypt : function (token)
	{
		var data = [{journal_no: token.jour_no,art_no: token.art_no}]
		var ciphertext = CryptoJS.AES.encrypt(JSON.stringify(data), 'WcYk\\AKp');		
		ciphertext = ciphertext.toString();
		ciphertext = (ciphertext.replace(/\+/g,'-'));
		ciphertext = (ciphertext.replace(/\/+/g,'_'));
		return ciphertext;
	}
};