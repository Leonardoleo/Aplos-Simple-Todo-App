/* storage.js */

// Simple Storage object
// to access localStorage, sessionStorage or a memoryStore.
// Cookies are supported to a limited extend.

// define storage object with memoryStore and configuration to fallback to
// cookie. By default there's only fallback to memory storage since many
// data objects probably are too large to store in cookie anyway.
var storage = {
	fallbackToCookie: false,
	clearExpiredLocal: true,
	clearExpiredSession: true,
	memoryStore: {
		_sessionStorage: {},
		_localStorage: {}
	},
	_enableUndo: false
};

// Let's see if storage is supported and available.
// (Safari throws a QUOTA_EXCEEDED_ERR exception in private browsing mode)
// NOTE: It's also possible to run into the QUOTA_EXCEEDED_ERR exception if
// the app is storing large amounts of info (>5MB), but that is not covered
// here because it would require a try/catch block for each `setItem()`
// attempt which is not desirable (the app should take care of good house-
// keeping practices - and, typically, in this case, the user is presented
// with a dialog to allow more storage).
try {
		sessionStorage.removeItem('TEST');
		sessionStorage.setItem('TEST', '1');
		sessionStorage.removeItem('TEST');
		storage.supportsSessionStorage = true;
	} catch(e) {
		storage.supportsSessionStorage = false;
}
try {
		localStorage.removeItem('TEST');
		localStorage.setItem('TEST', '1');
		localStorage.removeItem('TEST');
		storage.supportsLocalStorage = true;
	} catch(e) {
		storage.supportsLocalStorage = false;
}
storage.supportsDaStorage = storage.supportsSessionStorage && storage.supportsLocalStorage;



/*
 *************************************
 * COOKIE functions
 **************************************
 */

/* cookie helper functions - can be used as fallback for localStorage (default 1 year expiry unless isSession==true) */
storage.setInCookie = function(key, value, isSession, expHours, domain, path, secure){
	var expStr;
	var hours = (typeof expHours != "undefined") ? expHours : 365 * 24;
	var date = new Date();
	var domainStr = domain? "; Domain="+domain : "";
	var pathStr = path? "; Path="+path : "; Path=/";
	var secureStr = secure? "; secure" : "";
	date.setTime(date.getTime() + (hours * 60 * 60 * 1000));
	expStr = isSession? "" : "; Expires=" + date.toGMTString();
	document.cookie = key + "=" + value + domainStr + expStr + pathStr + secureStr;
};

storage.getFromCookie = function(key){
	var keyDel = key + "=";
	var cind = document.cookie.split(';');
	for (var i = 0, l = cind.length; i < l; i++) {
		var c = cind[i];
		while (c.charAt(0) === ' ') {
			c = c.substring(1, c.length);
		}
		if (c.indexOf(keyDel) === 0) {
			return c.substring(keyDel.length, c.length);
		}
	}
	return null;
};

storage.eraseCookie = function(key){
	this.setInCookie(key, "", true);
};

storage.expireCookie = function(key, cookieDomain){
	this.setInCookie(key, "", false, -1000, cookieDomain);
	if(cookieDomain.match(/\.[^.]+\.[^.]+\./)){
		//clear parent domain as well;
		this.setInCookie(key, "", false, -1000, cookieDomain.replace(/\.[^.]+/,""));
	}
};

/*
 *************************************
 * STORAGE functions
 **************************************
 */

 // set storage type to be used unless otherwise explicitly specified in
 // subsequent calls.
 // Define `type`="local" for localStorage
 // or `type`="session" for sessionStorage
storage.setType = function(type) {
	this._type = type;
};

// enable undo functionality
storage.enableUndo = function(bool) {
	bool = (bool === undefined) ? true : bool;
	this._enableUndo = bool;
};


/*
 * storage functions: `key` (string), `value` (string or json object). All
 * values are stored as stringified json. `type` indicates whether to store
 * in "session"Storage (default), "local"Storage or "memory".
 * `exp` is expiration time in milliseconds
 *
 * NOTE: setItem() can throw a QuotaExceededError exception if storage is
 * full. That case should be handled at application level; we don't want to
 * add a try/catch block here.
 */
storage.setItem = function(key, value, type, exp){
	var jsonv;
	var success = false;
	var dastorage = this._getDaStorage(type);
	var timestamp = (new Date()).getTime();
	key = this._getKeyName(key);
	this._setUndo(key, type);

	if(value == null){
		this.removeItem(key, type, dastorage);
	}
	jsonv = {
		_data_: value,
		_ts_: timestamp
	};
	if (exp) {
		jsonv._exp_ = timestamp + exp;
	}
	if (typeof JSON !== "undefined") {
		//Opera Mini (and maybe others) does not store values with double quotes, so replace them;
		var jsonvStr = JSON.stringify(jsonv).replace(/"/g, "^^");
		if (this._shouldUseCookie(type)) {
			this.setInCookie(key, jsonvStr);
		} else {
			// first do some housekeeping and remove expired items
			this.clearExpired(type);
			// store the new item
			// QUESTION: Should this be placed in try-catch? If so, what would
			// the recovery action be? Clear the whole cache? Clear oldest
			// item(s) untill action succeeds?
			if (typeof dastorage.setItem !== "undefined" && dastorage.removeItem !== "undefined") {
				//to prevent "quota exceeded" errors on iPad, the storage item needs to be removed before updating;
				dastorage.removeItem(key);
				dastorage.setItem(key, jsonvStr);
			} else {
				dastorage[key] = jsonvStr;
			}
		}
		success = true;
	}
	return success;
};

// retrieve the value for the given key
storage.getItem = function(key, type, dastorage){
	var jsonv;
	var jsonvStr;
	key = this._getKeyName(key);
	dastorage = dastorage || this._getDaStorage(type);
	if (this._shouldUseCookie(type)) {
		jsonvStr = this.getFromCookie(key);
	} else {
		if (typeof dastorage.getItem !== "undefined") {
			jsonvStr = dastorage.getItem(key);
		} else {
			jsonvStr = dastorage[key];
		}
	}
	if (typeof JSON !== "undefined" && typeof jsonvStr !== "undefined" && jsonvStr !== null) {
		// perform a sanity check to ensure this value was set by storage and
		// can be parsed safely
		if (jsonvStr.indexOf("^^_ts_^^") !== -1){
			jsonv = JSON.parse(jsonvStr.replace(/\^\^/g, '"'));
			if (jsonv._exp_ && (new Date()).getTime() > jsonv._exp_) {
				// value has expired
				jsonv = null;
				// remove it
				this.removeItem(key, type, dastorage);
			}
		} else {
			// this is not a value that was set using the storage, we're not sure
			// it's stringified JSON, so just return the plain value.
			jsonv = jsonvStr;
		}
	} else {
		jsonv = null;
	}
	return jsonv? jsonv._data_ : jsonv;
};

// retrieve the i-th key in the list of stored keys
// NO COOKIE SUPPORT
storage.getKey = function(i, type, dastorage) {
	var key;
	dastorage = dastorage || this._getDaStorage(type);
	if (dastorage.key) {
		// this is for either localStorage or sessionStorage
		key = dastorage.key(i);
	} else {
		// this is for the memoryStore object
		key = Object.keys(dastorage)[i];
	}
	return key;
};

// return number of key/value pairs that are stored
// NO COOKIE SUPPORT
storage.getLength = function(type, dastorage) {
	var length;
  var size = function(obj) {
        if (obj == null) return 0;
        return (obj.length === +obj.length) ? obj.length : Object.keys(obj).length;
      };
	dastorage = dastorage || this._getDaStorage(type);
	if (dastorage.length !== undefined) {
		// this is for either localStorage or sessionStorage
		length = dastorage.length;
	} else {
		// this is for the memoryStore
		length = size(dastorage);
	}
	return length;
};

// remove the key/value pair for a given key
// NO COOKIE SUPPORT
storage.removeItem = function(key, type, dastorage){
	key = this._getKeyName(key);
	dastorage = dastorage || this._getDaStorage(type);
	if (dastorage.removeItem) {
		// this is for either localStorage or sessionStorage
		dastorage.removeItem(key);
	} else {
		// this is for the memoryStore
		delete dastorage[key];
	}
};

// clear all key/value pairs
// NO COOKIE SUPPORT
// !!! CAREFUL: This clears everything in storage, not just items that
// were set with this app, also anything some other app on the same
// host might have stored!!!
storage.clear = function(type) {
	var dastorage = this._getDaStorage(type);
	if (dastorage.clear) {
		// this is for either localStorage or sessionStorage
		dastorage.clear();
	} else {
		// this is for the memoryStore
		// NOTE: `dastorage = {}` won't work, we need to reset each
		// property explicitly individually
		if (type === "local" || type === "session") {
			this.memoryStore["_" + type + "Storage"] = {};
		} else {
			this.memoryStore = {};
		}
	}
};
// clear all expired key/value pairs
// NO COOKIE SUPPORT
storage.clearExpired = function(type) {
	var dastorage = this._getDaStorage(type);
	var length = this.getLength(type, dastorage);
	for (var i=length; i; i--){
		// access all items - the act of getting them will automatically remove
		// them if they are expired
		this.getItem(this.getKey(i-1, type, dastorage), type, dastorage);
	}
};

// clear namespaced key/value pairs
// NO COOKIE SUPPORT
storage.clearNamespaced = function(ns, type) {
	var dastorage = this._getDaStorage(type);
	var length = this.getLength(type, dastorage);
	ns = (ns + ":").replace(/::/g, ":");
	for (var i=length; i; i--){
		var key = this.getKey(i-1, type, dastorage);
		if (key.indexOf(ns)===0){
			this.removeItem(key, type, dastorage);
		}
	}
};

// reset key to previously stored undo value and return that value
storage.undoItem = function(key, type) {
	if(this._enableUndo) {
		var undoPropName = this._getUndoPropName(key, type);
		var undoValue = storage[undoPropName];
		this.setItem(key, undoValue, type);
	}
  return this.getItem(key, type);
};

// internal method to determine storage type
storage._getType = function(type) {
	return type || this._type || "session";
}
// internal method to derive key name
storage._getKeyName = function(key) {
	return key.replace(/ /g, '');
}
// internal method to determine property name for undo item value
storage._getUndoPropName = function(key, type) {
	type = this._getType(type);
	return '_undo_' + type + '_' + key;
}
// internal method to store undo value
storage._setUndo = function(key, type) {
	if(this._enableUndo) {
		var undoPropName = this._getUndoPropName(key, type);
		storage[undoPropName] = this.getItem(key, type);
	}
}

// internal method to determine if cookie should be used for storage
storage._shouldUseCookie = function(type){
	return type === "cookie" || (!this._hasSupportedStorageType(type) && this.fallbackToCookie);
};
// internal method to get one of the three storage types.
// (or auto fallback to memoryStore)
storage._getDaStorage = function(type) {
	type = this._getType(type);
	switch(type) {
		case "local":
			return this._hasSupportedStorageType(type)? localStorage : this.memoryStore._localStorage;
		case "session":
			return this._hasSupportedStorageType(type)? sessionStorage : this.memoryStore._sessionStorage;
		case "memory":
			return this.memoryStore;
	}
};
// internal method to test if "local" or "session" storage type is supported
storage._hasSupportedStorageType = function(type) {
	return ((type === "local" && this.supportsLocalStorage) || (type==="session" && this.supportsSessionStorage));
};


// Convience methods for localStorage and sessionStorage
// There are no convenience methods for type "memory" and "cookie" because
// those are used rarely. They should be accessed directly when required.

// convenience methods for localStorage
storage.setLocalItem = function(key, value, exp) {
	return this.setItem(key, value, "local", exp);
};
storage.getLocalItem = function(key) {
	return this.getItem(key, "local");
};
storage.getLocalKey = function(i) {
	return this.getKey(i, "local");
};
storage.getLocalLength = function() {
	return this.getLength("local");
};
storage.removeLocalItem = function(key) {
	return this.removeItem(key, "local");
};
storage.clearLocal = function() {
	return this.clear("local");
};
storage.clearLocalExpired = function() {
	return this.clearExpired("local");
};
storage.clearLocalNamespaced = function(ns) {
	return this.clearNamespaced(ns, "local");
};
storage.undoLocalItem = function(key) {
	return this.undoItem(key, "local");
};

// convenience methods for sessionStorage
storage.setSessionItem = function(key, value, exp) {
	return this.setItem(key, value, "session", exp);
};
storage.getSessionItem = function(key) {
	return this.getItem(key, "session");
};
storage.getSessionKey = function(i) {
	return this.getKey(i, "session");
};
storage.getSessionLength = function() {
	return this.getLength("session");
};
storage.removeSessionItem = function(key) {
	return this.removeItem(key, "session");
};
storage.clearSession = function() {
	return this.clear("session");
};
storage.clearSessionExpired = function() {
	return this.clearExpired("session");
};
storage.clearSessionNamespaced = function(ns) {
	return this.clearNamespaced(ns, "session");
};
storage.undoSessionItem = function(key) {
	return this.undoItem(key, "session");
};

// on initialization, clear any expired items from browser Storage
if (storage.clearExpiredLocal) {storage.clearExpired("local");}
// the sessionStorage is most likely empty, but run clearExpired just in case
if (storage.clearExpiredSession) {storage.clearExpired("session");}



export default storage;
