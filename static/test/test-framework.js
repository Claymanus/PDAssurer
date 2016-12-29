function TFRWRK(test) {
	var self = this
	test=test || { debug: false, uribase: "" }
	this.debug=test.debug
	win = test.win || window;
    self.uribase=test.uribase;
	this.isLoggedIn=false;
	this.isAssurer=false;
	this.registrationMethode="pw";

TFRWRK.prototype.QueryStringFunc = function (search) { //http://stackoverflow.com/questions/979975/how-to-get-the-value-from-the-url-parameter
  var query_string = {};
  var query = search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
        // If first entry with this name
    if (typeof query_string[pair[0]] === "undefined") {
      query_string[pair[0]] = pair[1];
        // If second entry with this name
    } else if (typeof query_string[pair[0]] === "string") {
      var arr = [ query_string[pair[0]], pair[1] ];
      query_string[pair[0]] = arr;
        // If third or later entry with this name
    } else {
      query_string[pair[0]].push(pair[1]);
    }
  } 
    return query_string;
};

    this.QueryString = self.QueryStringFunc(win.location.search);
	
	TFRWRK.prototype.getThis=function() {
		return this
	}
	
	TFRWRK.prototype.reportServerFailure = function(text){
		self.displayMsg({title:_("Server error occured"),error: text})
	}

	TFRWRK.prototype.callback = function(next,error){
		var next  = next || function(){return},
		error = error || defaultErrorHandler,
		callback = function(status,text,xml) {
			console.log(status)
			switch (status){
				case 200:
					next(text,xml)
					break;
				case 500:
				case 405:
					self.reportServerFailure(text)
					break;
				default:
					error(status,text,xml)
			}
		},
		defaultErrorHandler = function(status,text,xml){
			console.log(text)
			data=JSON.parse(text)
			self.displayMsg(self.processErrors(data))
		};
		return callback;
	}
	
	TFRWRK.prototype.commonInit=function(text) {
		// initialising variables
		self.QueryString.uris = JSON.parse(text);
		self.uribase = self.QueryString.uris.BACKEND_PATH;
		if ( typeof facebook != "undefined" ) facebook.fbinit();
		if ( typeof Gettext == "undefined" ) _=function(x){return x};

		// filling hrefs of anchors
		[].forEach.call(document.getElementsByClassName("digest_self_made_button"), function(a){a.href=self.QueryString.uris.ANCHOR_URL})
		self.initialise()
	}
	
	TFRWRK.prototype.ajaxBase = function(callback) {
		var xmlhttp;
		if (win.XMLHttpRequest)
		  {// code for IE7+, Firefox, Chrome, Opera, Safari
		  xmlhttp = new win.XMLHttpRequest();
//		  xmlhttp.oName="XMLHttpRequest"; // for testing
		  }
		else
		  {// code for IE6, IE5
		  xmlhttp = new win.ActiveXObject("Microsoft.XMLHTTP");
//		  xmlhttp.oName="ActiveXObject";   // for testing
		  }
		xmlhttp.callback=callback // for testing
		xmlhttp.onreadystatechange=function()
		  {
		  if (xmlhttp.readyState==4)
		    {
		    	callback(xmlhttp.status,xmlhttp.responseText,xmlhttp.responseXML);
		    }
		  }
		return xmlhttp;
	}

	TFRWRK.prototype.ajaxpost = function( uri, data, callback ) {
		xmlhttp = this.ajaxBase( callback );
		xmlhttp.open( "POST", self.uribase + uri, true );
		xmlhttp.setRequestHeader( "Content-type","application/x-www-form-urlencoded" );
		l = []
		for (key in data) l.push( key + "=" + encodeURIComponent( data[key] ) ); 
		var dataString = l.join("&")
		console.log(uri)
		console.log(data)
		xmlhttp.send( dataString );
	}

	TFRWRK.prototype.ajaxget = function( uri, callback, direct) {
		xmlhttp = this.ajaxBase( callback )
		if (direct) {
			theUri = uri;
		} else {
			theUri = self.uribase + uri;
		}
		console.log(theUri)
		xmlhttp.open( "GET", theUri , true);
		xmlhttp.send();
	}

	
	TFRWRK.prototype.setAppCanEmailMe=function(app, value, callback){
		var csrf_token = self.getCookie('csrf');
	    data= {
			canemail: value,
	    	appname: self.myApps[self.currentAppId].name,
	    	csrf_token: csrf_token
	    }
	    self.ajaxpost("/v1/setappcanemail", data, self.callback(callback))
	}
	
	TFRWRK.prototype.parseUserdata = function(data) {
		var result ='\
		<table>\
			<tr>\
				<td><b>'+_("User identifier")+'</b></td>\
				<td>'+data.userid+'</td>\
			</tr>\
		</table>\
		<h4><b>'+_("Assurances")+'</b></h4>\
		<table>\
			<thead>\
				<tr>\
					<th>'+_("Name")+'</th>\
					<th>'+_("Assurer")+'</th>\
					<th>'+_("Date of assurance")+'</th>\
					<th>'+_("Valid until")+'</th>\
				</tr>\
			<tbody>'
		for(assurance in data.assurances) {
			for( var i=0; i<data.assurances[assurance].length; i++){
				result += '\
				<tr>\
					<td>'+_(data.assurances[assurance][i].name)+'</td>\
					<td>'+data.assurances[assurance][i].assurer+'</td>\
					<td>'+self.timestampToString(data.assurances[assurance][i].timestamp)+'</td>\
					<td>'+
//					self.timestampToString(data.assurances[assurance][i].valid)+
					_("unlimited")+
					'</td>\
				</tr>'
			}
		}
		result += '\
			</tbody>\
		</table>'
		return result
	}
	
	TFRWRK.prototype.timestampToString=function(timestamp){
			var date=new Date(timestamp*1000)
			return date.toLocaleDateString();
		}
	
// oldie	
	TFRWRK.prototype.myCallback = function(text) {

		if( self.page=="login"){
			if( self.QueryString.next) {
				self.doRedirect(decodeURIComponent(self.QueryString.next))
			}
		}
		var data = JSON.parse(text);
		var msg = self.processErrors(data)
		self.displayMsg(msg);

	}
	
	TFRWRK.prototype.meCallback = function(text) {
		var data = JSON.parse(text);
		var msg = self.processErrors(data)
		self.get_me()
		self.displayMsg(msg);
	}

	TFRWRK.prototype.registerCallback = function(text) {
		self.isLoggedIn=true
		if( self.page=="account"){
			var msg={
				title:_("Congratulation!"),
				error:_("You have succesfully registered and logged in. </br> Please click the link inside the email we sent you to validate your email address, otherwise your account will be destroyed in one week.")
				}
			self.displayMsg(msg)
			self.userIsLoggedIn (text)
		}
		if( self.page=="login"){
			self.ajaxget('/v1/getmyapps',self.callback(self.finishRegistration))
		}
	}	

	TFRWRK.prototype.reloadCallback = function(text) {
		var msg = self.processErrors(JSON.parse(text))
		msg.callback = self.doLoadHome;
		self.displayMsg(msg);
	}
	
	TFRWRK.prototype.doRedirect = function(href){ 
		win.location=href	
	}
	
	TFRWRK.prototype.doLoadHome = function() {
		self.doRedirect(self.QueryString.uris.START_URL);
	}
	
	TFRWRK.prototype.get_me = function() {
		this.success=self.userIsLoggedIn
		this.error=self.userNotLoggedIn
		self.ajaxget("/v1/users/me", self.callback(this.success, this.error))
	}
	
// Button actions

	TFRWRK.prototype.doPasswordReset = function() {
		secret = document.getElementById("PasswordResetForm_secret_input").value;
	    password = document.getElementById("PasswordResetForm_password_input").value;
	    this.ajaxpost("/v1/password_reset", {secret: secret, password: password}, self.callback(self.reloadCallback))
	}
	
	TFRWRK.prototype.InitiatePasswordReset = function(myForm) {
		var emailInput=document.getElementById(myForm+"_email_input").value
		if (emailInput!="")
			self.ajaxget("/v1/users/"+document.getElementById(myForm+"_email_input").value+"/passwordreset", self.callback(self.myCallback));
		else {
			emailInput.className="missing";
			this.displayMsg({"title":"Hiba","error":"Nem adtál meg email címet"})
		}
	}
	
	TFRWRK.prototype.login = function() {
	    username = document.getElementById("LoginForm_email_input").value;
	    var onerror=false;
		var errorMsg="";
		if (username=="") {
			errorMsg+=_("User name is missing. ");
			onerror=true;
		}
	    password = document.getElementById("LoginForm_password_input").value;
	    if (password=="") {
			errorMsg+=_("Password is missing. ");
			onerror=true; 
		}
		if (onerror==true) self.displayMsg({error:errorMsg, title:_("Missing data")});
		else {
			var data = {
				credentialType: "password", 
				identifier: username, 
				password: password
				}
			self.ajaxpost( "/v1/login", data, self.callback(self.userIsLoggedIn) )
		}
	}

	TFRWRK.prototype.login_with_facebook = function(userId, accessToken) {
		console.log("facebook login")
	    username = userId
	    password = encodeURIComponent(accessToken)
	    data = {
	    	credentialType: 'facebook',
	    	identifier: username,
	    	password: password
	    }
	    self.ajaxpost("/v1/login", data , self.callback(self.userIsLoggedIn) )
	}

	TFRWRK.prototype.logoutCallback = function(status, text) {
console.log("logoutCallback")
		data=JSON.parse(text)
		if (data.error)	self.displayError();
		else {
			var loc = '' +win.location
			var newloc = loc.replace(self.QueryString.uris.SSL_LOGIN_BASE_URL, self.QueryString.uris.BASE_URL)
			if (newloc!=loc) self.doRedirect( newloc );
			else {
				self.isLoggedIn=false
				self.doRedirect( self.QueryString.uris.START_URL)
			}
		}
	}
	
	TFRWRK.prototype.logout = function() {
				console.log("logout")
	    this.ajaxget("/v1/logout", this.logoutCallback)
	}
	
	TFRWRK.prototype.getCookie = function(cname) {
	    var name = cname + "=";
	    var ca = win.document.cookie.split(';');
	    for(var i=0; i<ca.length; i++) {
	        var c = ca[i];
	        while (c.charAt(0)==' ') c = c.substring(1);
	        if (c.indexOf(name) == 0) {
				return c.substring(name.length,c.length);
			}
	    }
	    return "";
	} 

	TFRWRK.prototype.InitiateResendRegistrationEmail = function() {
		self.displayMsg({title:_("Under construction"), error:_("This function is not working yet.")});	
		}

	TFRWRK.prototype.loadjs = function(src) {
	    var fileref=document.createElement('script')
	    fileref.setAttribute("type","text/javascript")
	    fileref.setAttribute("src", src)
	    document.getElementsByTagName("head")[0].appendChild(fileref)
	}
	
	TFRWRK.prototype.unittest = function() {
		this.loadjs("ts.js")
	}
	

	TFRWRK.prototype.RemoveCredential = function(formName) {
		self.formName = formName
		this.doRemove = function(type) {
			credentialType = (type)?type:document.getElementById(this.formName+"_credentialType").innerHTML;
			identifier = document.getElementById(this.formName+"_identifier").innerHTML;
			text = {
				csrf_token: self.getCookie("csrf"),
				credentialType: credentialType,
				identifier: identifier
			}
			console.log("text")
			this.ajaxpost("/v1/remove_credential", text, self.callback(self.meCallback));
		}
		return self
	}
	
	TFRWRK.prototype.GoogleLogin = function(){
		self.displayMsg({title:_("Under construction"), error:_("This function is not working yet.")});	
	}
	
	TFRWRK.prototype.GoogleRegister = function(){
		self.displayMsg({title:_("Under construction"), error:_("This function is not working yet.")});	
	}
	
	TFRWRK.prototype.TwitterLogin = function(){
		self.displayMsg({title:_("Under construction"), error:_("This function is not working yet.")});	
	}
	
	TFRWRK.prototype.addPasswordCredential = function(){
		var identifier=document.getElementById("AddPasswordCredentialForm_username_input").value;
		var secret=document.getElementById("AddPasswordCredentialForm_password_input").value;
		self.addCredential("password", identifier, secret);
	}
	
	TFRWRK.prototype.add_facebook_credential = function( FbUserId, FbAccessToken) {
		self.addCredential("facebook", FbUserId, FbAccessToken);
	}
	
	TFRWRK.prototype.addGoogleCredential = function(){
		self.displayMsg({title:_("Under construction"), error:_("This function is not working yet.")});	
	}
	
	TFRWRK.prototype.addGithubCredential = function(){
		self.displayMsg({title:_("Under construction"), error:_("This function is not working yet.")});	
	}
	
	TFRWRK.prototype.addTwitterCredential = function(){
		self.displayMsg({title:_("Under construction"), error:_("This function is not working yet.")});	
	}
	
	TFRWRK.prototype.doDeregister = function() {
		if ( document.getElementById("accept_deregister").checked ) {
			if ( self.QueryString.secret ) {
				text = {	csrf_token: self.getCookie("csrf"),
							deregister_secret: self.QueryString.secret
							}
				self.ajaxpost( "/v1/deregister_doit", text, self.callback(self.deregisterCallback) )
			}
			else {
				var msg={ 	title:_("Error message"),
							error:_("The secret is missing")}
				self.displayMsg(msg);			
			}
		}
		else {
			var msg={ 	title:_("Error message"),
						error:_("To accept the terms please mark the checkbox!")}
			self.displayMsg(msg);	
		}			
	}
	
	TFRWRK.prototype.initiateDeregister = function(theForm) {
		text = { csrf_token: self.getCookie("csrf") }
		self.ajaxpost("/v1/deregister", text, self.callback(self.myCallback))
	}
	
	TFRWRK.prototype.deregisterCallback = function(text) {
		var msg=self.processErrors(JSON.parse(text))
		self.isLoggedIn=false
		self.refreshTheNavbar();
		if (self.page=="account") {
			self.displayTheSection("login");
		}
		msg.callback=function(){self.doRedirect(self.QueryString.uris.START_URL)};
		self.displayMsg(msg);
	}
	
	TFRWRK.prototype.refreshTheNavbar=function(){
		if (self.isLoggedIn) {
			document.getElementById("nav-bar-login").style.display="none";
			document.getElementById("nav-bar-register").style.display="none";
			document.getElementById("nav-bar-my_account").style.display="block";
			document.getElementById("nav-bar-logout").style.display="block";
		}
		else {
			document.getElementById("nav-bar-my_account").style.display="none";
			document.getElementById("nav-bar-logout").style.display="none";
			document.getElementById("nav-bar-login").style.display="block";
			document.getElementById("nav-bar-register").style.display="block";
		}
	}

	TFRWRK.prototype.sslLogin = function() {
		console.log("sslLogin")
		var xmlhttp = this.ajaxBase( self.callback(self.userIsLoggedIn,self.userNotLoggedIn) )
		xmlhttp.open( "GET", self.QueryString.uris.SSL_LOGIN_BASE_URL+self.uribase+'/v1/ssl_login' , true);
		xmlhttp.send();
	}
//Getdigest functions	
	TFRWRK.prototype.normalizeString = function(val) {
		var   accented="öüóőúéáűíÖÜÓŐÚÉÁŰÍ";
		var unaccented="ouooueauiouooueaui";
		var s = "";
		
		for (var i = 0, len = val.length; i < len; i++) {
		  c = val[i];
		  if(c.match('[abcdefghijklmnopqrstuvwxyz]')) {
		    s=s+c;
		  } else if(c.match('[ABCDEFGHIJKLMNOPQRSTUVXYZ]')) {
		    s=s+c.toLowerCase();
		  } else if(c.match('['+accented+']')) {
		    for (var j = 0, alen = accented.length; j <alen; j++) {
		      if(c.match(accented[j])) {
		        s=s+unaccented[j];
		      }
		    }
		  }
		}
		return s;
	}
	
	TFRWRK.prototype.digestGetter = function(formName) {
		var formName=formName
		var digestCallback
		
		digestCallback = function(status,text,xml) {
			var diegestInput=document.getElementById(formName + "_digest_input")
			if (status==200) {
				diegestInput.value = xml.getElementsByTagName('hash')[0].childNodes[0].nodeValue;
				$("#"+formName + "_digest_input").trigger('keyup');
				document.getElementById(formName + "_predigest_input").value = "";
				switch (formName) {
					case "assurancing":
						var messageBox=document.getElementById("assurance-giving_message")
						messageBox.innerHTML=_("The Secret Hash is given for assuring")
						messageBox.className="given"
						document.getElementById("assurance-giving_submit-button").className=""
						break;
					case "login":
						self.changeHash()
						break;
					case "registration-form":
						document.getElementById(formName+"_code-generation-input").style.display="none"
						document.getElementById(formName+"_digest-input").style.display="block"
						self.activateButton( formName+"_make-here", function(){self.digestGetter(formName).methodChooser('here')})
						break;
					default:
						document.getElementById(formName+"_code-generation-input").style.display="none"
				}
			}
			else {
				self.displayMsg({title:_("Error message"),error: text});
				diegestInput.value =""
				if (formName=="assurancing") {
					var messageBox=document.getElementById("assurance-giving_message")
					messageBox.innerHTML=_("The Secret Hash isn't given yet")
					messageBox.className="missing"
					document.getElementById("assurance-giving_submit-button").className="inactive"
				}
			}
		}

		this.methodChooser = function(method) {
			var selfButton = formName+"_make-self"
			var hereButton = formName+"_make-here"
			switch (method) {
				case "here":
					document.getElementById(formName+"_code-generation-input").style.display="block"
					document.getElementById(formName+"_digest-input").style.display="none"
					self.activateButton( selfButton, function(){self.digestGetter(formName).methodChooser('self')} )
					self.deactivateButton( hereButton )
					break;
				case "self":
					document.getElementById(formName+"_code-generation-input").style.display="none"
					document.getElementById(formName+"_digest-input").style.display="block"
					self.activateButton( hereButton, function(){self.digestGetter(formName).methodChooser('here')} )
					self.deactivateButton( selfButton )
					break;
				default:
			}
		}
		
		this.getDigest = function() {
			text = createXmlForAnchor(formName)
			if (text == null) return;
			http = self.ajaxBase(digestCallback);
			http.open("POST",self.QueryString.uris.ANCHOR_URL+"anchor",true);
			http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		  	http.setRequestHeader("Content-length", text.length);
		  	http.setRequestHeader("Connection", "close");
			http.send(text);
		}
	
		function createXmlForAnchor(formName) {
			console.log(formName)
			personalId = document.getElementById(formName+"_predigest_input").value;
			motherValue = document.getElementById(formName+"_predigest_mothername").value;
			mothername = self.normalizeString(motherValue);
			if ( personalId == "") {
				self.displayMsg({title:_('Missing data'), error:_("Personal identifier is missing")})
				return;
			}
			if ( mothername == "") {
				self.displayMsg({title:_('Missing data'), error:_("Mother's name is missing")})
				return;
			}
			return ("<request><id>"+personalId+"</id><mothername>"+mothername+"</mothername></request>");
		}
		
		return this
	}
	
	TFRWRK.prototype.convert_mothername = function(formName) {
		var inputElement = document.getElementById( formName+"_mothername");
		var outputElement = document.getElementById( formName+"_monitor");
		outputElement.innerHTML=document.getElementById( formName+"_input").value +' - '+ self.normalizeString(inputElement.value);
	}	
	TFRWRK.prototype.setRegistrationMethode=function(methode){
		self.registrationMethode=methode;
		[].forEach.call( document.getElementById("registration-form-method-selector").getElementsByClassName("social"), function (e) { e.className=e.className.replace(" active",""); } );
		document.getElementById("registration-form-method-selector-"+methode).className+=" active"
		var heading
		switch (methode) {
			case "pw":
				heading=_("email address and/or username / password")
				document.getElementById("registration-form-password-container").style.display="block";
				document.getElementById("registration-form-username-container").style.display="block";
				document.getElementById("registration-ssltext-container").style.display="none";
				document.getElementById("registration-form_secret_input").value="";
				document.getElementById("registration-form_identifier_input").value="";
			break;
			case "fb":
				heading=_("my facebook account")
				document.getElementById("registration-form-password-container").style.display="none";
				document.getElementById("registration-form-username-container").style.display="none";
				document.getElementById("registration-ssltext-container").style.display="none";
				facebook.fbregister()
			break;
			case "ssl":
				heading=_("SSL certificate")
				document.getElementById("registration-form-password-container").style.display="none";
				document.getElementById("registration-form-username-container").style.display="none";
				document.getElementById("registration-ssltext-container").style.display="block";
			break;
		}
		document.getElementById("registration-form-method-heading").innerHTML=_("Registration with %s ",heading);
	}

	TFRWRK.prototype.register = function(credentialType) {
		//
	    var identifier = (document.getElementById("registration-form_identifier_input").value=="")?
			document.getElementById("registration-form_email_input").value:
			document.getElementById("registration-form_identifier_input").value;
	    var secret = document.getElementById("registration-form_secret_input").value;
	    var email = document.getElementById("registration-form_email_input").value;
		var d=document.getElementById("registration-form_digest_input");
		var digest =(d)?d.value:"";
	    var data= {
	    	credentialType: credentialType,
	    	identifier: identifier,
	    	email: email,
	    	digest: digest
	    }
		if (credentialType=="password") data.password=secret;
		else data.secret=secret
	    self.ajaxpost("/v1/register", data, self.callback(self.registerCallback))
	}
	
	TFRWRK.prototype.onSslRegister= function(){
		console.log('ssl_onSslRegister')
		if (self.sslCallback()) self.sslLogin();
	}

	TFRWRK.prototype.addSslCredentialCallback= function(){
		if (self.sslCallback()) self.get_me();
	}

	TFRWRK.prototype.doRegister=function() {
		if ( document.getElementById("registration-form_confirmField").checked ) {
			console.log(self.registrationMethode)
			switch (self.registrationMethode) {
				case "pw":
					console.log('pw')
					var pwInput=document.getElementById("registration-form_secret_input")
					var pwBackup=document.getElementById("registration-form_secret_backup")
					if (pwInput.value!=pwBackup.value) self.displayMsg({title:_("Error message"),error:_("The passwords are not identical")})
					else self.register("password")
					break;
				case "fb":
					console.log('fb')
					self.register("facebook")
					break;
				case "ssl":
					console.log('ssl_register')
					document.getElementById("SSL").onload=self.onSslRegister;
					document.getElementById('registration-keygenform').submit();
					console.log("after submit")
//					self.doRedirect(self.QueryString.uris.SSL_LOGIN_BASE_URL+"fiokom.html")
					break;
			}
		}
		else self.displayMsg({title:_("Acceptance is missing"),error:_("For the registration you have to accept the terms of use. To accept the terms of use please mark the checkbox!")})
	}
	
	TFRWRK.prototype.sslCallback=function() {
		console.log("sslCallback")
		response=document.getElementById("SSL").contentDocument.body.innerHTML
		console.log(response)
		if (response!="")  {
			var msg
			if (data=JSON.parse(response)) {
				msg=self.processErrors(data)
			}
			else {
				msg.title=_("Server failure")
				msg.error=response
			}
			self.displayMsg(msg)
			return false
		}
		else return true
	}
	
	TFRWRK.prototype.deactivateButton = function(buttonId) {
		b=document.getElementById(buttonId)
		if (b) {
			b.className+=" inactive";
			b.onclick=function(){return}
		}		
	}
	
	TFRWRK.prototype.activateButton = function(buttonId, onclickFunc) {
		b=document.getElementById(buttonId)
		if (b) {
			b.className=b.className.slice(0,b.className.indexOf("inactive"))
			b.onclick=onclickFunc
		}
	}

	TFRWRK.prototype.passwordChanged = function(formName) {
		var strength = document.getElementById(formName+"_pw-strength-meter");
		var strongRegex = new RegExp("^(?=.{10,})((?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[^a-zA-Z0-9_])).*$", "g");
		var mediumRegex = new RegExp("^(?=.{8,})((?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])).*$", "g");
		var enoughRegex = new RegExp("(?=.{8,}).*", "g");
		var pwd = document.getElementById(formName+"_secret_input");
		if (pwd.value.length==0) {
			strength.innerHTML = _('Type Password');
		} 
		else if (false == enoughRegex.test(pwd.value)) {
				strength.innerHTML = _("More Characters");
			} 
			else if (strongRegex.test(pwd.value)) {
					strength.innerHTML = '<span style="color:green">'+_("Strong!")+'</span>';
				} 
				else if (mediumRegex.test(pwd.value)) {
						strength.innerHTML = '<span style="color:orange">'+_("Medium!")+'</span>';
					} 
					else {
						strength.innerHTML = '<span style="color:red">'+_("Weak!")+'</span>';	
					}
		self.pwEqual(formName)
	}
	
	TFRWRK.prototype.pwEqual = function(formName) {
		var pwInput=document.getElementById(formName+"_secret_input")
		var pwBackup=document.getElementById(formName+"_secret_backup")
		var pwEqual=document.getElementById(formName+"_pw-equal")
		if (pwInput.value==pwBackup.value) pwEqual.innerHTML = '<span style="color:green">'+_("OK.")+'</span>';	
		else pwEqual.innerHTML = '<span style="color:red">'+_("Passwords are not equal.")+'</span>';	
	}
	
	TFRWRK.prototype.main = function(){
	}
	
	TFRWRK.prototype.loadTest = function(test){
		var loadTestCallback = function(js){
			console.log("loadtestcallback")
			sessionStorage.clear();
			document.getElementById("qunit").innerHTML=""
			QUnit.init()
			QUnit.load()
			eval(js);
		}
		self.ajaxget(test+".js", self.callback(loadTestCallback))
	}
	
	TFRWRK.prototype.loadPage = function(page, test){
		console.log("loadpage")
		var testFrame=document.getElementById('testarea')
		testFrame.onload=function(){
				test(testFrame);
				}
		testFrame.src='../'+page
	}
	
	TFRWRK.prototype.loadTest = function(test){
		var loadTestCallback = function(js){
			console.log("loadtestcallback")
			sessionStorage.clear();
			document.getElementById("qunit").innerHTML=""
			QUnit.init()
			QUnit.load()
			eval(js);
		}
		self.ajaxget(test+".js", self.callback(loadTestCallback))
	}	
	
	TFRWRK.prototype.doTest = function(url, test) {
		var loadMockCallback = function(mock){
			var loadUtestCallback = function(uTest){
				var tFrame=document.getElementById('testarea')
				tFrame.onload=function(){
					var tWin=tFrame.contentWindow,
						sContainer=tWin.document.createElement('script')
					tWin.QUnit=QUnit
					tWin.console=console
					tScript=mock+uTest
					sContainer.setAttribute("type","text/javascript");
					sContainer.innerHTML=mock+uTest;
					QUnit.XmlContainer = document.getElementById("qunit-xml")
					tWin.document.getElementsByTagName("body")[0].appendChild(sContainer);
				}
				tFrame.src='../'+url
			}
			self.ajaxget("unitTests/"+test+".tst.js", self.callback(loadUtestCallback))
		}
		self.ajaxget("unitTests/_mock.js", self.callback(loadMockCallback))		
	}
	
}
	
tfrwrk = new TFRWRK();
