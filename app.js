(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err = [e], e;
    }
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // node_modules/@capacitor/core/dist/index.js
  var ExceptionCode, CapacitorException, getPlatformId, createCapacitor, initCapacitorGlobal, Capacitor, registerPlugin, WebPlugin, encode, decode, CapacitorCookiesPluginWeb, CapacitorCookies, readBlobAsBase64, normalizeHttpHeaders, buildUrlParams, buildRequestInit, CapacitorHttpPluginWeb, CapacitorHttp, SystemBarsStyle, SystemBarType, SystemBarsPluginWeb, SystemBars;
  var init_dist = __esm({
    "node_modules/@capacitor/core/dist/index.js"() {
      (function(ExceptionCode2) {
        ExceptionCode2["Unimplemented"] = "UNIMPLEMENTED";
        ExceptionCode2["Unavailable"] = "UNAVAILABLE";
      })(ExceptionCode || (ExceptionCode = {}));
      CapacitorException = class extends Error {
        constructor(message, code, data) {
          super(message);
          this.message = message;
          this.code = code;
          this.data = data;
        }
      };
      getPlatformId = (win) => {
        var _a, _b;
        if (win === null || win === void 0 ? void 0 : win.androidBridge) {
          return "android";
        } else if ((_b = (_a = win === null || win === void 0 ? void 0 : win.webkit) === null || _a === void 0 ? void 0 : _a.messageHandlers) === null || _b === void 0 ? void 0 : _b.bridge) {
          return "ios";
        } else {
          return "web";
        }
      };
      createCapacitor = (win) => {
        const capCustomPlatform = win.CapacitorCustomPlatform || null;
        const cap = win.Capacitor || {};
        const Plugins = cap.Plugins = cap.Plugins || {};
        const getPlatform = () => {
          return capCustomPlatform !== null ? capCustomPlatform.name : getPlatformId(win);
        };
        const isNativePlatform = () => getPlatform() !== "web";
        const isPluginAvailable = (pluginName) => {
          const plugin = registeredPlugins.get(pluginName);
          if (plugin === null || plugin === void 0 ? void 0 : plugin.platforms.has(getPlatform())) {
            return true;
          }
          if (getPluginHeader(pluginName)) {
            return true;
          }
          return false;
        };
        const getPluginHeader = (pluginName) => {
          var _a;
          return (_a = cap.PluginHeaders) === null || _a === void 0 ? void 0 : _a.find((h) => h.name === pluginName);
        };
        const handleError = (err) => win.console.error(err);
        const registeredPlugins = /* @__PURE__ */ new Map();
        const registerPlugin2 = (pluginName, jsImplementations = {}) => {
          const registeredPlugin = registeredPlugins.get(pluginName);
          if (registeredPlugin) {
            console.warn(`Capacitor plugin "${pluginName}" already registered. Cannot register plugins twice.`);
            return registeredPlugin.proxy;
          }
          const platform = getPlatform();
          const pluginHeader = getPluginHeader(pluginName);
          let jsImplementation;
          const loadPluginImplementation = async () => {
            if (!jsImplementation && platform in jsImplementations) {
              jsImplementation = typeof jsImplementations[platform] === "function" ? jsImplementation = await jsImplementations[platform]() : jsImplementation = jsImplementations[platform];
            } else if (capCustomPlatform !== null && !jsImplementation && "web" in jsImplementations) {
              jsImplementation = typeof jsImplementations["web"] === "function" ? jsImplementation = await jsImplementations["web"]() : jsImplementation = jsImplementations["web"];
            }
            return jsImplementation;
          };
          const createPluginMethod = (impl, prop) => {
            var _a, _b;
            if (pluginHeader) {
              const methodHeader = pluginHeader === null || pluginHeader === void 0 ? void 0 : pluginHeader.methods.find((m) => prop === m.name);
              if (methodHeader) {
                if (methodHeader.rtype === "promise") {
                  return (options) => cap.nativePromise(pluginName, prop.toString(), options);
                } else {
                  return (options, callback) => cap.nativeCallback(pluginName, prop.toString(), options, callback);
                }
              } else if (impl) {
                return (_a = impl[prop]) === null || _a === void 0 ? void 0 : _a.bind(impl);
              }
            } else if (impl) {
              return (_b = impl[prop]) === null || _b === void 0 ? void 0 : _b.bind(impl);
            } else {
              throw new CapacitorException(`"${pluginName}" plugin is not implemented on ${platform}`, ExceptionCode.Unimplemented);
            }
          };
          const createPluginMethodWrapper = (prop) => {
            let remove;
            const wrapper = (...args) => {
              const p = loadPluginImplementation().then((impl) => {
                const fn = createPluginMethod(impl, prop);
                if (fn) {
                  const p2 = fn(...args);
                  remove = p2 === null || p2 === void 0 ? void 0 : p2.remove;
                  return p2;
                } else {
                  throw new CapacitorException(`"${pluginName}.${prop}()" is not implemented on ${platform}`, ExceptionCode.Unimplemented);
                }
              });
              if (prop === "addListener") {
                p.remove = async () => remove();
              }
              return p;
            };
            wrapper.toString = () => `${prop.toString()}() { [capacitor code] }`;
            Object.defineProperty(wrapper, "name", {
              value: prop,
              writable: false,
              configurable: false
            });
            return wrapper;
          };
          const addListener = createPluginMethodWrapper("addListener");
          const removeListener = createPluginMethodWrapper("removeListener");
          const addListenerNative = (eventName, callback) => {
            const call = addListener({ eventName }, callback);
            const remove = async () => {
              const callbackId = await call;
              removeListener({
                eventName,
                callbackId
              }, callback);
            };
            const p = new Promise((resolve) => call.then(() => resolve({ remove })));
            p.remove = async () => {
              console.warn(`Using addListener() without 'await' is deprecated.`);
              await remove();
            };
            return p;
          };
          const proxy = new Proxy({}, {
            get(_, prop) {
              switch (prop) {
                // https://github.com/facebook/react/issues/20030
                case "$$typeof":
                  return void 0;
                case "toJSON":
                  return () => ({});
                case "addListener":
                  return pluginHeader ? addListenerNative : addListener;
                case "removeListener":
                  return removeListener;
                default:
                  return createPluginMethodWrapper(prop);
              }
            }
          });
          Plugins[pluginName] = proxy;
          registeredPlugins.set(pluginName, {
            name: pluginName,
            proxy,
            platforms: /* @__PURE__ */ new Set([...Object.keys(jsImplementations), ...pluginHeader ? [platform] : []])
          });
          return proxy;
        };
        if (!cap.convertFileSrc) {
          cap.convertFileSrc = (filePath) => filePath;
        }
        cap.getPlatform = getPlatform;
        cap.handleError = handleError;
        cap.isNativePlatform = isNativePlatform;
        cap.isPluginAvailable = isPluginAvailable;
        cap.registerPlugin = registerPlugin2;
        cap.Exception = CapacitorException;
        cap.DEBUG = !!cap.DEBUG;
        cap.isLoggingEnabled = !!cap.isLoggingEnabled;
        return cap;
      };
      initCapacitorGlobal = (win) => win.Capacitor = createCapacitor(win);
      Capacitor = /* @__PURE__ */ initCapacitorGlobal(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
      registerPlugin = Capacitor.registerPlugin;
      WebPlugin = class {
        constructor() {
          this.listeners = {};
          this.retainedEventArguments = {};
          this.windowListeners = {};
        }
        addListener(eventName, listenerFunc) {
          let firstListener = false;
          const listeners = this.listeners[eventName];
          if (!listeners) {
            this.listeners[eventName] = [];
            firstListener = true;
          }
          this.listeners[eventName].push(listenerFunc);
          const windowListener = this.windowListeners[eventName];
          if (windowListener && !windowListener.registered) {
            this.addWindowListener(windowListener);
          }
          if (firstListener) {
            this.sendRetainedArgumentsForEvent(eventName);
          }
          const remove = async () => this.removeListener(eventName, listenerFunc);
          const p = Promise.resolve({ remove });
          return p;
        }
        async removeAllListeners() {
          this.listeners = {};
          for (const listener in this.windowListeners) {
            this.removeWindowListener(this.windowListeners[listener]);
          }
          this.windowListeners = {};
        }
        notifyListeners(eventName, data, retainUntilConsumed) {
          const listeners = this.listeners[eventName];
          if (!listeners) {
            if (retainUntilConsumed) {
              let args = this.retainedEventArguments[eventName];
              if (!args) {
                args = [];
              }
              args.push(data);
              this.retainedEventArguments[eventName] = args;
            }
            return;
          }
          listeners.forEach((listener) => listener(data));
        }
        hasListeners(eventName) {
          var _a;
          return !!((_a = this.listeners[eventName]) === null || _a === void 0 ? void 0 : _a.length);
        }
        registerWindowListener(windowEventName, pluginEventName) {
          this.windowListeners[pluginEventName] = {
            registered: false,
            windowEventName,
            pluginEventName,
            handler: (event) => {
              this.notifyListeners(pluginEventName, event);
            }
          };
        }
        unimplemented(msg2 = "not implemented") {
          return new Capacitor.Exception(msg2, ExceptionCode.Unimplemented);
        }
        unavailable(msg2 = "not available") {
          return new Capacitor.Exception(msg2, ExceptionCode.Unavailable);
        }
        async removeListener(eventName, listenerFunc) {
          const listeners = this.listeners[eventName];
          if (!listeners) {
            return;
          }
          const index = listeners.indexOf(listenerFunc);
          if (index !== -1) {
            this.listeners[eventName].splice(index, 1);
          }
          if (!this.listeners[eventName].length) {
            this.removeWindowListener(this.windowListeners[eventName]);
          }
        }
        addWindowListener(handle) {
          window.addEventListener(handle.windowEventName, handle.handler);
          handle.registered = true;
        }
        removeWindowListener(handle) {
          if (!handle) {
            return;
          }
          window.removeEventListener(handle.windowEventName, handle.handler);
          handle.registered = false;
        }
        sendRetainedArgumentsForEvent(eventName) {
          const args = this.retainedEventArguments[eventName];
          if (!args) {
            return;
          }
          delete this.retainedEventArguments[eventName];
          args.forEach((arg) => {
            this.notifyListeners(eventName, arg);
          });
        }
      };
      encode = (str) => encodeURIComponent(str).replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent).replace(/[()]/g, escape);
      decode = (str) => str.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent);
      CapacitorCookiesPluginWeb = class extends WebPlugin {
        async getCookies() {
          const cookies = document.cookie;
          const cookieMap = {};
          cookies.split(";").forEach((cookie) => {
            if (cookie.length <= 0)
              return;
            let [key2, value] = cookie.replace(/=/, "CAP_COOKIE").split("CAP_COOKIE");
            key2 = decode(key2).trim();
            value = decode(value).trim();
            cookieMap[key2] = value;
          });
          return cookieMap;
        }
        async setCookie(options) {
          try {
            const encodedKey = encode(options.key);
            const encodedValue = encode(options.value);
            const expires = options.expires ? `; expires=${options.expires.replace("expires=", "")}` : "";
            const path = (options.path || "/").replace("path=", "");
            const domain = options.url != null && options.url.length > 0 ? `domain=${options.url}` : "";
            document.cookie = `${encodedKey}=${encodedValue || ""}${expires}; path=${path}; ${domain};`;
          } catch (error) {
            return Promise.reject(error);
          }
        }
        async deleteCookie(options) {
          try {
            document.cookie = `${options.key}=; Max-Age=0`;
          } catch (error) {
            return Promise.reject(error);
          }
        }
        async clearCookies() {
          try {
            const cookies = document.cookie.split(";") || [];
            for (const cookie of cookies) {
              document.cookie = cookie.replace(/^ +/, "").replace(/=.*/, `=;expires=${(/* @__PURE__ */ new Date()).toUTCString()};path=/`);
            }
          } catch (error) {
            return Promise.reject(error);
          }
        }
        async clearAllCookies() {
          try {
            await this.clearCookies();
          } catch (error) {
            return Promise.reject(error);
          }
        }
      };
      CapacitorCookies = registerPlugin("CapacitorCookies", {
        web: () => new CapacitorCookiesPluginWeb()
      });
      readBlobAsBase64 = async (blob) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64String = reader.result;
          resolve(base64String.indexOf(",") >= 0 ? base64String.split(",")[1] : base64String);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(blob);
      });
      normalizeHttpHeaders = (headers = {}) => {
        const originalKeys = Object.keys(headers);
        const loweredKeys = Object.keys(headers).map((k) => k.toLocaleLowerCase());
        const normalized = loweredKeys.reduce((acc, key2, index) => {
          acc[key2] = headers[originalKeys[index]];
          return acc;
        }, {});
        return normalized;
      };
      buildUrlParams = (params, shouldEncode = true) => {
        if (!params)
          return null;
        const output = Object.entries(params).reduce((accumulator, entry) => {
          const [key2, value] = entry;
          let encodedValue;
          let item;
          if (Array.isArray(value)) {
            item = "";
            value.forEach((str) => {
              encodedValue = shouldEncode ? encodeURIComponent(str) : str;
              item += `${key2}=${encodedValue}&`;
            });
            item.slice(0, -1);
          } else {
            encodedValue = shouldEncode ? encodeURIComponent(value) : value;
            item = `${key2}=${encodedValue}`;
          }
          return `${accumulator}&${item}`;
        }, "");
        return output.substr(1);
      };
      buildRequestInit = (options, extra = {}) => {
        const output = Object.assign({ method: options.method || "GET", headers: options.headers }, extra);
        const headers = normalizeHttpHeaders(options.headers);
        const type = headers["content-type"] || "";
        if (typeof options.data === "string") {
          output.body = options.data;
        } else if (type.includes("application/x-www-form-urlencoded")) {
          const params = new URLSearchParams();
          for (const [key2, value] of Object.entries(options.data || {})) {
            params.set(key2, value);
          }
          output.body = params.toString();
        } else if (type.includes("multipart/form-data") || options.data instanceof FormData) {
          const form = new FormData();
          if (options.data instanceof FormData) {
            options.data.forEach((value, key2) => {
              form.append(key2, value);
            });
          } else {
            for (const key2 of Object.keys(options.data)) {
              form.append(key2, options.data[key2]);
            }
          }
          output.body = form;
          const headers2 = new Headers(output.headers);
          headers2.delete("content-type");
          output.headers = headers2;
        } else if (type.includes("application/json") || typeof options.data === "object") {
          output.body = JSON.stringify(options.data);
        }
        return output;
      };
      CapacitorHttpPluginWeb = class extends WebPlugin {
        /**
         * Perform an Http request given a set of options
         * @param options Options to build the HTTP request
         */
        async request(options) {
          const requestInit = buildRequestInit(options, options.webFetchExtra);
          const urlParams = buildUrlParams(options.params, options.shouldEncodeUrlParams);
          const url = urlParams ? `${options.url}?${urlParams}` : options.url;
          const response = await fetch(url, requestInit);
          const contentType = response.headers.get("content-type") || "";
          let { responseType = "text" } = response.ok ? options : {};
          if (contentType.includes("application/json")) {
            responseType = "json";
          }
          let data;
          let blob;
          switch (responseType) {
            case "arraybuffer":
            case "blob":
              blob = await response.blob();
              data = await readBlobAsBase64(blob);
              break;
            case "json":
              data = await response.json();
              break;
            case "document":
            case "text":
            default:
              data = await response.text();
          }
          const headers = {};
          response.headers.forEach((value, key2) => {
            headers[key2] = value;
          });
          return {
            data,
            headers,
            status: response.status,
            url: response.url
          };
        }
        /**
         * Perform an Http GET request given a set of options
         * @param options Options to build the HTTP request
         */
        async get(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "GET" }));
        }
        /**
         * Perform an Http POST request given a set of options
         * @param options Options to build the HTTP request
         */
        async post(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "POST" }));
        }
        /**
         * Perform an Http PUT request given a set of options
         * @param options Options to build the HTTP request
         */
        async put(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "PUT" }));
        }
        /**
         * Perform an Http PATCH request given a set of options
         * @param options Options to build the HTTP request
         */
        async patch(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "PATCH" }));
        }
        /**
         * Perform an Http DELETE request given a set of options
         * @param options Options to build the HTTP request
         */
        async delete(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "DELETE" }));
        }
      };
      CapacitorHttp = registerPlugin("CapacitorHttp", {
        web: () => new CapacitorHttpPluginWeb()
      });
      (function(SystemBarsStyle2) {
        SystemBarsStyle2["Dark"] = "DARK";
        SystemBarsStyle2["Light"] = "LIGHT";
        SystemBarsStyle2["Default"] = "DEFAULT";
      })(SystemBarsStyle || (SystemBarsStyle = {}));
      (function(SystemBarType2) {
        SystemBarType2["StatusBar"] = "StatusBar";
        SystemBarType2["NavigationBar"] = "NavigationBar";
      })(SystemBarType || (SystemBarType = {}));
      SystemBarsPluginWeb = class extends WebPlugin {
        async setStyle() {
          this.unavailable("not available for web");
        }
        async setAnimation() {
          this.unavailable("not available for web");
        }
        async show() {
          this.unavailable("not available for web");
        }
        async hide() {
          this.unavailable("not available for web");
        }
      };
      SystemBars = registerPlugin("SystemBars", {
        web: () => new SystemBarsPluginWeb()
      });
    }
  });

  // node_modules/@capacitor/local-notifications/dist/esm/web.js
  var web_exports = {};
  __export(web_exports, {
    LocalNotificationsWeb: () => LocalNotificationsWeb
  });
  var LocalNotificationsWeb;
  var init_web = __esm({
    "node_modules/@capacitor/local-notifications/dist/esm/web.js"() {
      init_dist();
      LocalNotificationsWeb = class extends WebPlugin {
        constructor() {
          super(...arguments);
          this.pending = [];
          this.deliveredNotifications = [];
          this.hasNotificationSupport = () => {
            if (!("Notification" in window) || !Notification.requestPermission) {
              return false;
            }
            if (Notification.permission !== "granted") {
              try {
                new Notification("");
              } catch (e) {
                if (e instanceof Error && e.name === "TypeError") {
                  return false;
                }
              }
            }
            return true;
          };
        }
        async getDeliveredNotifications() {
          const deliveredSchemas = [];
          for (const notification of this.deliveredNotifications) {
            const deliveredSchema = {
              title: notification.title,
              id: parseInt(notification.tag),
              body: notification.body
            };
            deliveredSchemas.push(deliveredSchema);
          }
          return {
            notifications: deliveredSchemas
          };
        }
        async removeDeliveredNotifications(delivered) {
          for (const toRemove of delivered.notifications) {
            const found = this.deliveredNotifications.find((n) => n.tag === String(toRemove.id));
            found === null || found === void 0 ? void 0 : found.close();
            this.deliveredNotifications = this.deliveredNotifications.filter(() => !found);
          }
        }
        async removeAllDeliveredNotifications() {
          for (const notification of this.deliveredNotifications) {
            notification.close();
          }
          this.deliveredNotifications = [];
        }
        async createChannel() {
          throw this.unimplemented("Not implemented on web.");
        }
        async deleteChannel() {
          throw this.unimplemented("Not implemented on web.");
        }
        async listChannels() {
          throw this.unimplemented("Not implemented on web.");
        }
        async schedule(options) {
          if (!this.hasNotificationSupport()) {
            throw this.unavailable("Notifications not supported in this browser.");
          }
          for (const notification of options.notifications) {
            this.sendNotification(notification);
          }
          return {
            notifications: options.notifications.map((notification) => ({
              id: notification.id
            }))
          };
        }
        async getPending() {
          return {
            notifications: this.pending
          };
        }
        async registerActionTypes() {
          throw this.unimplemented("Not implemented on web.");
        }
        async cancel(pending) {
          this.pending = this.pending.filter((notification) => !pending.notifications.find((n) => n.id === notification.id));
        }
        async areEnabled() {
          const { display } = await this.checkPermissions();
          return {
            value: display === "granted"
          };
        }
        async changeExactNotificationSetting() {
          throw this.unimplemented("Not implemented on web.");
        }
        async checkExactNotificationSetting() {
          throw this.unimplemented("Not implemented on web.");
        }
        async requestPermissions() {
          if (!this.hasNotificationSupport()) {
            throw this.unavailable("Notifications not supported in this browser.");
          }
          const display = this.transformNotificationPermission(await Notification.requestPermission());
          return { display };
        }
        async checkPermissions() {
          if (!this.hasNotificationSupport()) {
            throw this.unavailable("Notifications not supported in this browser.");
          }
          const display = this.transformNotificationPermission(Notification.permission);
          return { display };
        }
        transformNotificationPermission(permission) {
          switch (permission) {
            case "granted":
              return "granted";
            case "denied":
              return "denied";
            default:
              return "prompt";
          }
        }
        sendPending() {
          var _a;
          const toRemove = [];
          const now = (/* @__PURE__ */ new Date()).getTime();
          for (const notification of this.pending) {
            if (((_a = notification.schedule) === null || _a === void 0 ? void 0 : _a.at) && notification.schedule.at.getTime() <= now) {
              this.buildNotification(notification);
              toRemove.push(notification);
            }
          }
          this.pending = this.pending.filter((notification) => !toRemove.find((n) => n === notification));
        }
        sendNotification(notification) {
          var _a;
          if ((_a = notification.schedule) === null || _a === void 0 ? void 0 : _a.at) {
            const diff = notification.schedule.at.getTime() - (/* @__PURE__ */ new Date()).getTime();
            this.pending.push(notification);
            setTimeout(() => {
              this.sendPending();
            }, diff);
            return;
          }
          this.buildNotification(notification);
        }
        buildNotification(notification) {
          const localNotification = new Notification(notification.title, {
            body: notification.body,
            tag: String(notification.id)
          });
          localNotification.addEventListener("click", this.onClick.bind(this, notification), false);
          localNotification.addEventListener("show", this.onShow.bind(this, notification), false);
          localNotification.addEventListener("close", () => {
            this.deliveredNotifications = this.deliveredNotifications.filter(() => !this);
          }, false);
          this.deliveredNotifications.push(localNotification);
          return localNotification;
        }
        onClick(notification) {
          const data = {
            actionId: "tap",
            notification
          };
          this.notifyListeners("localNotificationActionPerformed", data);
        }
        onShow(notification) {
          this.notifyListeners("localNotificationReceived", notification);
        }
      };
    }
  });

  // node_modules/@capacitor/local-notifications/dist/esm/index.js
  init_dist();

  // node_modules/@capacitor/local-notifications/dist/esm/definitions.js
  var Weekday;
  (function(Weekday2) {
    Weekday2[Weekday2["Sunday"] = 1] = "Sunday";
    Weekday2[Weekday2["Monday"] = 2] = "Monday";
    Weekday2[Weekday2["Tuesday"] = 3] = "Tuesday";
    Weekday2[Weekday2["Wednesday"] = 4] = "Wednesday";
    Weekday2[Weekday2["Thursday"] = 5] = "Thursday";
    Weekday2[Weekday2["Friday"] = 6] = "Friday";
    Weekday2[Weekday2["Saturday"] = 7] = "Saturday";
  })(Weekday || (Weekday = {}));

  // node_modules/@capacitor/local-notifications/dist/esm/index.js
  var LocalNotifications = registerPlugin("LocalNotifications", {
    web: () => Promise.resolve().then(() => (init_web(), web_exports)).then((m) => new m.LocalNotificationsWeb())
  });

  // src/app.js
  init_dist();
  var mem = null;
  function load() {
    try {
      var r = localStorage.getItem("momentum.v1");
      if (r) return JSON.parse(r);
    } catch (e) {
    }
    return mem || { tasks: [], habits: [], goals: [], tab: "today" };
  }
  function save() {
    try {
      if (S.profiles && S.activeProfile) {
        var p = S.profiles.find(function(x) {
          return x.id === S.activeProfile;
        });
        if (p) {
          p.tasks = S.tasks;
          p.habits = S.habits;
          p.goals = S.goals;
        }
      }
      localStorage.setItem("momentum.v1", JSON.stringify(S));
    } catch (e) {
      mem = S;
    }
  }
  var S = load();
  S.tab = S.tab || "today";
  var arm = null;
  var deferred = null;
  var profileOpen = false;
  var habitDetail = null;
  var quickOpen = "";
  var editItem = null;
  function pad(n) {
    return String(n).padStart(2, "0");
  }
  function day(d) {
    d = d || /* @__PURE__ */ new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  if (!Array.isArray(S.profiles) || !S.profiles.length) {
    pid = uid();
    S.profiles = [{ id: pid, name: "Guest", tasks: S.tasks || [], habits: S.habits || [], goals: S.goals || [] }];
    S.activeProfile = pid;
  }
  var pid;
  S.activeProfile = S.activeProfile || S.profiles[0].id;
  var active = S.profiles.find(function(x) {
    return x.id === S.activeProfile;
  }) || S.profiles[0];
  S.activeProfile = active.id;
  S.tasks = active.tasks || [];
  S.habits = active.habits || [];
  S.goals = active.goals || [];
  S.profiles.forEach(function(p) {
    p.tasks = p.tasks || [];
    p.habits = p.habits || [];
    p.goals = p.goals || [];
    p.habits.forEach(function(h) {
      h.log = Array.isArray(h.log) ? h.log : [];
    });
  });
  if (S.profiles.length === 1 && S.profiles[0].name === "Gagan" && !S.tasks.length && !S.habits.length && !S.goals.length) S.profiles[0].name = "Guest";
  var viewDay = day();
  function wkKey() {
    var d = /* @__PURE__ */ new Date();
    d.setDate(d.getDate() - (d.getDay() + 6) % 7);
    return "w" + day(d);
  }
  function key(p) {
    var d = /* @__PURE__ */ new Date();
    return p === "week" ? wkKey() : p === "month" ? "m" + d.getFullYear() + "-" + pad(d.getMonth() + 1) : "y" + d.getFullYear();
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function(c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }
  function streakThrough(h, end) {
    var logs = new Set(h.log || []), d = /* @__PURE__ */ new Date(end + "T12:00:00"), n = 0;
    if (!logs.has(day(d))) return 0;
    while (logs.has(day(d))) {
      n++;
      d.setDate(d.getDate() - 1);
    }
    return n;
  }
  function streak(h) {
    var d = /* @__PURE__ */ new Date();
    d.setHours(12, 0, 0, 0);
    if (h.log.indexOf(day(d)) < 0) {
      d.setDate(d.getDate() - 1);
      if (h.log.indexOf(day(d)) < 0) return 0;
    }
    return streakThrough(h, day(d));
  }
  function best(h) {
    var l = h.log.slice().sort(), b = 0, c = 0, p = null;
    l.forEach(function(x) {
      var t = /* @__PURE__ */ new Date(x + "T00:00:00");
      if (p && Math.round((t - p) / 864e5) === 1) c++;
      else c = 1;
      p = t;
      if (c > b) b = c;
    });
    return b;
  }
  function rollover() {
    var t = day();
    S.tasks.forEach(function(x) {
      x.createdOn = x.createdOn || x.on || t;
      if (x.done && !x.doneOn) x.doneOn = x.on || t;
    });
    S.goals.forEach(function(g) {
      var k = key(g.p);
      if (g.key !== k) {
        if (g.key && g.prog >= g.target) g.hist = (g.hist || 0) + 1;
        g.key = k;
        g.prog = 0;
      }
    });
  }
  rollover();
  var EM = ["\u{1F4A7}", "\u{1F3C3}", "\u{1F4D6}", "\u{1F9D8}", "\u{1F4AA}", "\u{1F33F}", "\u{1F634}", "\u270D\uFE0F", "\u{1F957}", "\u{1F3AF}"];
  var PL = { week: "This week", month: "This month", year: "This year" };
  function toast(m) {
    var t = document.getElementById("toast");
    t.textContent = m;
    t.className = "show";
    clearTimeout(toast.t);
    toast.t = setTimeout(function() {
      t.className = "";
    }, 2200);
  }
  async function scheduleReminder(task, due) {
    if (!due) return;
    if (!Capacitor.isNativePlatform()) {
      toast("Reminders work in the installed Android app");
      return;
    }
    var when = new Date(due);
    if (!Number.isFinite(when.getTime()) || when <= /* @__PURE__ */ new Date()) {
      toast("Choose a future reminder time");
      return;
    }
    try {
      var p = await LocalNotifications.checkPermissions();
      if (p.display !== "granted") p = await LocalNotifications.requestPermissions();
      if (p.display !== "granted") {
        toast("Allow notifications to use reminders");
        return;
      }
      task.reminderId = task.reminderId || Math.floor(Math.random() * 1e9) + 1;
      await LocalNotifications.schedule({ notifications: [{ id: task.reminderId, title: "Momentum reminder", body: task.t, schedule: { at: when } }] });
      task.due = due;
      save();
      render();
      toast("Reminder set");
    } catch (e) {
      toast("Could not set reminder. Check notification permission.");
    }
  }
  function cancelReminder(task) {
    if (task && task.reminderId && Capacitor.isNativePlatform()) LocalNotifications.cancel({ notifications: [{ id: task.reminderId }] }).catch(function() {
    });
  }
  function pct() {
    var t = day(), tasks2 = S.tasks.filter(function(x) {
      return (x.createdOn || t) <= t && (!x.doneOn || x.doneOn >= t);
    }), b = tasks2.filter(function(x) {
      return x.doneOn === t || !x.doneOn && x.done && x.on === t;
    }).length, c = S.habits.length, d = S.habits.filter(function(h) {
      return h.log.indexOf(t) >= 0;
    }).length;
    return tasks2.length + c ? Math.round((b + d) / (tasks2.length + c) * 100) : 0;
  }
  function msg(p, n) {
    if (!n) return "Add one task or habit to start your day.";
    if (p === 0) return "Fresh day. Pick one small win.";
    if (p < 50) return "Good start. Keep the chain going.";
    if (p < 100) return "More than halfway there.";
    return "Day cleared. Your streaks are safe.";
  }
  function profile() {
    return S.profiles.find(function(x) {
      return x.id === S.activeProfile;
    }) || S.profiles[0];
  }
  function head() {
    var p = pct(), n = S.tasks.length + S.habits.length, hour = (/* @__PURE__ */ new Date()).getHours(), g = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening", name = profile().name, initial = name.trim().charAt(0).toUpperCase() || "G", titles = { today: "Today", tasks: "To-do", habits: "Habits", insights: "Progress", goals: "Goals", profile: "Profile", settings: "Settings", menu: "Menu" }, title = titles[S.tab] || "Today";
    return '<div class="top"><div><div class="eyebrow">MOMENTUM \xB7 ' + title.toUpperCase() + "</div><h1>" + (S.tab === "today" ? g + ", " + esc(name) : title) + "</h1>" + (S.tab === "today" ? "<p>" + msg(p, n) + "</p>" : "") + "</div>" + (S.tab === "today" ? '<button class="profile-btn" data-a="tab" data-id="menu" aria-label="Open menu"><span class="avatar">' + esc(initial) + "</span><span>\u2630</span></button>" : "") + "</div>" + (S.tab === "today" ? '<div class="progress-card"><div><h2>Today\u2019s progress</h2><p>' + p + '% complete</p></div><div class="progress-ring" style="--progress:' + p + '%"><b>' + p + "%</b></div></div>" : "");
  }
  function taskRow(x, done) {
    return '<div class="task' + (done ? " done" : "") + '"><button class="chk" data-a="tog" data-id="' + x.id + '" aria-label="Toggle task">' + (done ? "\u2713" : "") + '</button><span class="tt">' + esc(x.t) + (x.note ? "<small>" + esc(x.note) + "</small>" : "") + (x.due ? '<small class="hint"> \xB7 \u{1F514} ' + esc(x.due.replace("T", " ")) + "</small>" : "") + '</span><button class="ic" data-a="editTask" data-id="' + x.id + '" aria-label="Edit task">\u270E</button><button class="ic' + (x.star ? " star" : "") + '" data-a="star" data-id="' + x.id + '" aria-label="Priority">' + (x.star ? "\u2605" : "\u2606") + "</button>" + (arm === x.id ? '<button class="arm" data-a="del" data-id="' + x.id + '">Delete?</button>' : '<button class="ic" data-a="arm" data-id="' + x.id + '" aria-label="Delete">\u22EF</button>') + "</div>";
  }
  function today() {
    var t = viewDay, o = "";
    if (S.habits.length) {
      o += '<div class="sec"><span>Today\u2019s habits</span><button class="text-action" data-a="tab" data-id="habits">View all \u203A</button></div><div class="chips">' + S.habits.slice(0, 4).map(function(h) {
        var on = h.log.indexOf(t) >= 0;
        return '<button class="chip' + (on ? " on" : "") + '" data-a="hab" data-id="' + h.id + '">' + h.e + " " + esc(h.n) + ' <span class="fl">' + (on ? "\u2713" : "\u25CB") + "</span></button>";
      }).join("") + "</div>";
    }
    o += '<div class="sec"><span>Tasks</span><span class="daynav"><input type="date" id="viewday" value="' + t + '" aria-label="Choose day">' + (t !== day() ? '<button class="sm" data-a="daytoday">Today</button>' : "") + "</span></div>";
    var list = S.tasks.filter(function(x) {
      var created = x.createdOn || x.on || day();
      if (created > t) return false;
      return !x.doneOn || x.doneOn >= t;
    }), done = list.filter(function(x) {
      return x.doneOn === t || !x.doneOn && x.done && x.on === t;
    }), pending = list.filter(function(x) {
      return done.indexOf(x) < 0;
    });
    o += '<div class="card">' + (pending.length ? '<div class="section-label">To do \xB7 ' + pending.length + "</div>" + pending.map(function(x) {
      return taskRow(x, false);
    }).join("") : done.length ? "" : '<div class="empty">Nothing planned. Tap + to add one small task.</div>') + (done.length ? '<details class="completed-group"><summary>Completed \xB7 ' + done.length + "</summary>" + done.map(function(x) {
      return taskRow(x, true);
    }).join("") + "</details>" : "") + "</div>";
    return o;
  }
  function tasks() {
    var t = viewDay, list = S.tasks.filter(function(x) {
      var created = x.createdOn || x.on || day();
      return created <= t && (!x.doneOn || x.doneOn >= t);
    }), done = list.filter(function(x) {
      return x.doneOn === t || !x.doneOn && x.done && x.on === t;
    }), pending = list.filter(function(x) {
      return done.indexOf(x) < 0;
    });
    return '<div class="sec"><span>Plan your day</span><span class="daynav"><input type="date" id="viewday" value="' + t + '" aria-label="Choose day">' + (t !== day() ? '<button class="sm" data-a="daytoday">Today</button>' : "") + '</span></div><div class="card">' + (pending.length ? '<div class="section-label">To do \xB7 ' + pending.length + "</div>" + pending.map(function(x) {
      return taskRow(x, false);
    }).join("") : done.length ? "" : '<div class="empty">Nothing planned. Tap + to add a task.</div>') + (done.length ? '<details class="completed-group" open><summary>Completed \xB7 ' + done.length + "</summary>" + done.map(function(x) {
      return taskRow(x, true);
    }).join("") + "</details>" : "") + "</div>";
  }
  function goals() {
    var o = '<div class="sec"><span>Goals</span><button class="text-action" data-a="quick" data-id="goal">\uFF0B Add goal</button></div>';
    ["week", "month", "year"].forEach(function(p) {
      var l = S.goals.filter(function(g) {
        return g.p === p;
      });
      if (!l.length) return;
      o += '<div class="sec">' + PL[p] + "</div>";
      l.forEach(function(g) {
        var r = Math.min(100, Math.round(g.prog / g.target * 100)), hit = g.prog >= g.target;
        o += '<div class="card goal-card"><button class="goal-open" data-a="editGoal" data-id="' + g.id + '"><span class="gt">' + esc(g.t) + (hit ? " \u{1F3C6}" : "") + '</span><span class="ic">\u270E</span></button>' + (g.note ? '<p class="remark">' + esc(g.note) + "</p>" : "") + '<div class="bar"><i style="width:' + r + '%"></i></div><div class="row"><span class="sub">' + g.prog + " of " + g.target + " (" + r + "%)" + (g.hist ? " \xB7 hit " + g.hist + "x before" : "") + '</span><span><button class="sm" data-a="gm" data-id="' + g.id + '" aria-label="Minus one">\u22121</button> <button class="sm" data-a="gp" data-id="' + g.id + '" aria-label="Plus one">+1</button></span></div></div>';
      });
    });
    if (!S.goals.length) o += '<div class="card empty">Set a weekly, monthly or yearly target. Tap +1 whenever you make progress.</div>';
    return o;
  }
  function habits() {
    var o = '<div class="sec"><span>Your habits \xB7 ' + S.habits.length + '</span><button class="text-action" data-a="quick" data-id="habit">\uFF0B Add habit</button></div>';
    o += S.habits.map(function(h) {
      var s = streak(h), w = "";
      for (var i = 6; i >= 0; i--) {
        var d = /* @__PURE__ */ new Date();
        d.setHours(12, 0, 0, 0);
        d.setDate(d.getDate() - i);
        var k = day(d);
        w += '<button class="dot' + (h.log.indexOf(k) >= 0 ? " on" : "") + (k === day() ? " today" : "") + '" data-a="hdaydetail" data-id="' + h.id + '" data-d="' + k + '" aria-label="Details for ' + k + '"><span>' + "SMTWTFS"[d.getDay()] + "</span><b>" + (h.log.indexOf(k) >= 0 ? "\u2713" : d.getDate()) + "</b></button>";
      }
      return '<div class="card"><div class="row"><button class="habit-title" data-a="editHabit" data-id="' + h.id + '"><span><b class="gt">' + h.e + " " + esc(h.n) + "</b>" + (h.note ? "<small>" + esc(h.note) + "</small>" : "") + "<small>Best " + best(h) + " days \xB7 " + h.log.length + ' check-ins</small></span><span class="ic">\u270E</span></button><button class="streak-button" data-a="streakdetail" data-id="' + h.id + '"><b>\u{1F525} ' + s + '</b><span>day streak \xB7 details</span></button></div><div class="week">' + w + '</div><div class="row habit-actions"><span class="hint">Tap a day to update its check-in</span>' + (arm === h.id ? '<button class="arm" data-a="delh" data-id="' + h.id + '">Delete?</button>' : '<button class="ic" data-a="arm" data-id="' + h.id + '" aria-label="Delete habit">\u22EF</button>') + "</div></div>";
    }).join("");
    if (!S.habits.length) o += '<div class="card empty">Habits build streaks. Add one and tick it each day.</div>';
    return o;
  }
  function insights() {
    var total = S.tasks.length + S.habits.reduce(function(n, h) {
      return n + h.log.length;
    }, 0), done = S.tasks.filter(function(t) {
      return !!t.doneOn || t.done;
    }).length + S.habits.reduce(function(n, h) {
      return n + h.log.length;
    }, 0), rate = total ? Math.round(done / total * 100) : 0;
    var w = "";
    for (var i = 6; i >= 0; i--) {
      var d = /* @__PURE__ */ new Date();
      d.setHours(12, 0, 0, 0);
      d.setDate(d.getDate() - i);
      var k = day(d), c = S.tasks.filter(function(t) {
        return t.doneOn === k;
      }).length + S.habits.filter(function(h) {
        return h.log.indexOf(k) >= 0;
      }).length;
      w += '<div class="bar-day"><i style="height:' + Math.max(6, Math.min(100, c * 18)) + '%"></i><span>' + "SMTWTFS"[d.getDay()] + "</span></div>";
    }
    return '<div class="card insight-hero"><span class="hint">ALL TIME COMPLETION</span><strong>' + rate + '%</strong><span class="sub">' + done + " completed \xB7 " + S.habits.reduce(function(n, h) {
      return n + h.log.length;
    }, 0) + ' habit check-ins</span></div><div class="sec">This week</div><div class="card chart">' + w + '</div><div class="sec">Your streaks</div>' + (S.habits.length ? S.habits.map(function(h) {
      return '<div class="card row"><span>' + h.e + " " + esc(h.n) + "</span><b>\u{1F525} " + streak(h) + " day" + (streak(h) === 1 ? "" : "s") + "</b></div>";
    }).join("") : '<div class="card empty">Add a habit to start building your streaks.</div>');
  }
  function menuPage() {
    var links = [["goals", "\u25CE", "Goals", "Set targets and track progress"], ["insights", "\u25F7", "Progress", "See your consistency over time"], ["profile", "\u25CB", "Profile", "Switch profiles or edit your name"], ["settings", "\u2699", "Settings", "Theme, wallpaper, fonts and data"]];
    return '<div class="sec">Your space</div><div class="menu-grid">' + links.map(function(x) {
      return '<button class="card menu-link" data-a="tab" data-id="' + x[0] + '"><span class="menu-ico">' + x[1] + "</span><span><b>" + x[2] + "</b><small>" + x[3] + '</small></span><span class="menu-arrow">\u203A</span></button>';
    }).join("") + '</div><div class="sec">Quick actions</div><div class="card settings-list"><button data-a="exp">Export a backup <span>\u203A</span></button><button data-a="imp">Restore a backup <span>\u203A</span></button>' + (deferred ? '<button data-a="inst">Install Momentum <span>\u203A</span></button>' : "") + '</div><p class="privacy-note">Your habits, tasks and profiles stay on this device.</p>';
  }
  function profilePage() {
    var name = profile().name, initial = name.trim().charAt(0).toUpperCase() || "G";
    return '<div class="card profile-hero"><span class="avatar">' + esc(initial) + "</span><h2>" + esc(name) + '</h2><p>Build better habits, one day at a time.</p><button class="text-action" data-a="editProfile">Edit profile name</button></div><div class="sec">Profiles</div><div class="card profile-list">' + S.profiles.map(function(p) {
      return '<div class="profile-row"><button data-a="switchProfile" data-id="' + p.id + '"><span class="avatar">' + esc((p.name || "G").charAt(0).toUpperCase()) + "</span><span>" + esc(p.name) + "</span>" + (p.id === S.activeProfile ? "<b>Current</b>" : "") + '</button><button class="ic" data-a="renameProfile" data-id="' + p.id + '" aria-label="Rename profile">\u270E</button>' + (p.id === S.activeProfile && S.profiles.length > 1 ? '<button class="ic" data-a="profilerem" aria-label="Remove profile">\u22EF</button>' : "") + "</div>";
    }).join("") + '<button class="text-action" data-a="quick" data-id="newProfile">\uFF0B Add profile</button></div><div class="sec">Your goals</div>' + goals();
  }
  function settingsPage() {
    var accents = [["Green", "#1f9d4d"], ["Purple", "#7c5cf0"], ["Blue", "#2f8cf0"], ["Orange", "#f08a24"], ["Rose", "#d84a60"], ["Teal", "#129b91"]], walls = [["Plain", "plain"], ["Warm", "warm"], ["Lavender", "lavender"], ["Mint", "mint"]];
    return '<div class="sec">Appearance</div><div class="card settings-card"><label>Theme</label><select id="themechoice"><option value="system"' + ((S.theme || "system") === "system" ? " selected" : "") + '>System default</option><option value="light"' + (S.theme === "light" ? " selected" : "") + '>Light</option><option value="dark"' + (S.theme === "dark" ? " selected" : "") + '>Dark</option></select><label>Accent colour</label><div class="swatches">' + accents.map(function(a) {
      return '<button class="swatch' + ((S.accent || "#1f9d4d") === a[1] ? " selected" : "") + '" style="--swatch:' + a[1] + '" data-a="accent" data-id="' + a[1] + '" aria-label="' + a[0] + '"></button>';
    }).join("") + '</div><label>Wallpaper</label><div class="wallpapers">' + walls.map(function(w) {
      return '<button class="wallpaper wallpaper-' + w[1] + ((S.wallpaper || "warm") === w[1] ? " selected" : "") + '" data-a="wallpaper" data-id="' + w[1] + '">' + w[0] + "</button>";
    }).join("") + '</div><label>Font</label><select id="fontchoice"><option value="system"' + ((S.font || "system") === "system" ? " selected" : "") + '>System</option><option value="dm"' + (S.font === "dm" ? " selected" : "") + '>DM Sans</option><option value="bricolage"' + (S.font === "bricolage" ? " selected" : "") + '>Bricolage</option></select><p class="hint">Google Fonts are used on the website. The APK stays offline and uses system fonts.</p></div><div class="sec">Your data</div><div class="card settings-list"><button data-a="exp">Export backup <span>\u203A</span></button><button data-a="imp">Restore backup <span>\u203A</span></button></div>';
  }
  function quickSheet() {
    if (!quickOpen) return "";
    var type = quickOpen, edit = !!editItem && (type.indexOf("edit") === 0 || type === "renameProfile"), obj = edit ? type === "editTask" ? find("tasks", editItem) : type === "editHabit" ? find("habits", editItem) : type === "editGoal" ? find("goals", editItem) : type === "renameProfile" ? S.profiles.find(function(p) {
      return p.id === editItem;
    }) : profile() : null, title = edit ? "Edit " + (type === "editTask" ? "task" : type === "editHabit" ? "habit" : type === "editGoal" ? "goal" : "profile") : type === "editProfile" ? "Edit profile" : type === "habit" ? "New habit" : type === "goal" ? "New goal" : type === "newProfile" ? "New profile" : "New task", form = type === "editTask" ? "editTask" : type === "editHabit" ? "editHabit" : type === "editGoal" ? "editGoal" : type === "renameProfile" ? "renameProfile" : type === "editProfile" ? "editProfile" : type === "newProfile" ? "newProfile" : type === "habit" ? "quickHabit" : type === "goal" ? "quickGoal" : "quickTask", body = "";
    if (form === "quickTask" || form === "editTask") {
      var t = obj || {};
      body = '<form data-f="' + form + '"><label>Task</label><input id="qtitle" maxlength="120" value="' + esc(t.t || "") + '" placeholder="What needs doing?" required><label>Date</label><input id="qdate" type="date" value="' + (t.createdOn || viewDay) + '"><label>Reminder (optional)</label><input id="qdue" type="datetime-local" value="' + esc(t.due || "") + '"><label>Note (optional)</label><textarea id="qnote" maxlength="300" placeholder="Add a detail">' + esc(t.note || "") + '</textarea><button class="btn">Save task</button>' + (edit ? '<button type="button" class="btn danger" data-a="del" data-id="' + t.id + '">Delete task</button>' : "") + "</form>";
    }
    if (form === "quickHabit" || form === "editHabit") {
      var h = obj || {};
      body = '<form data-f="' + form + '"><label>Habit</label><input id="qtitle" maxlength="40" value="' + esc(h.n || "") + '" placeholder="e.g. Read for 10 minutes" required><label>Icon</label><input id="qicon" maxlength="4" value="' + esc(h.e || "\u{1F4A7}") + '" placeholder="\u{1F4A7}"><label>Note (optional)</label><textarea id="qnote" maxlength="300" placeholder="What does this habit mean to you?">' + esc(h.note || "") + '</textarea><button class="btn">Save habit</button>' + (edit ? '<button type="button" class="btn danger" data-a="delh" data-id="' + h.id + '">Delete habit</button>' : "") + "</form>";
    }
    if (form === "quickGoal" || form === "editGoal") {
      var g = obj || {};
      body = '<form data-f="' + form + '"><label>Goal</label><input id="qtitle" maxlength="80" value="' + esc(g.t || "") + '" placeholder="What do you want to achieve?" required><div class="row"><div><label>Target</label><input id="qtarget" type="number" min="1" value="' + (g.target || "") + '" required></div><div><label>Timeframe</label><select id="qperiod"><option value="week"' + (g.p === "week" ? " selected" : "") + '>Weekly</option><option value="month"' + ((g.p || "month") === "month" ? " selected" : "") + '>Monthly</option><option value="year"' + (g.p === "year" ? " selected" : "") + '>Yearly</option></select></div></div><label>Note (optional)</label><textarea id="qnote" maxlength="300" placeholder="Add a reminder or reason">' + esc(g.note || "") + '</textarea><button class="btn">Save goal</button>' + (edit ? '<button type="button" class="btn danger" data-a="delg" data-id="' + g.id + '">Delete goal</button>' : "") + "</form>";
    }
    if (form === "editProfile" || form === "newProfile" || form === "renameProfile") {
      body = '<form data-f="' + form + '"><label>Profile name</label><input id="qtitle" maxlength="32" value="' + (obj ? esc(obj.name) : "") + '" placeholder="e.g. Devanshu" required><button class="btn">Save profile</button></form>';
    }
    return '<div class="sheet-back" data-a="quickclose"><section class="sheet" role="dialog" aria-modal="true"><div class="sheet-handle"></div><div class="row"><h2>' + title + '</h2><button class="ic" data-a="quickclose" aria-label="Close">\xD7</button></div>' + body + "</section></div>";
  }
  function foot() {
    return "";
  }
  function habitModal() {
    if (!habitDetail) return "";
    var h = find("habits", habitDetail.id);
    if (!h) return "";
    var d = habitDetail.date || day(), checked = h.log.indexOf(d) >= 0, dt = /* @__PURE__ */ new Date(d + "T12:00:00"), label = dt.toLocaleDateString(void 0, { weekday: "long", month: "long", day: "numeric" }), run = streakThrough(h, d), wk = "";
    for (var i = 6; i >= 0; i--) {
      var x = /* @__PURE__ */ new Date(d + "T12:00:00");
      x.setDate(x.getDate() - i);
      var k = day(x);
      wk += "<span>" + "SMTWTFS"[x.getDay()] + '<b class="' + (h.log.indexOf(k) >= 0 ? "on" : "") + '">' + (h.log.indexOf(k) >= 0 ? "\u2713" : x.getDate()) + "</b></span>";
    }
    return '<div class="modal-backdrop" data-a="habitclose"><section class="modal" role="dialog" aria-modal="true" aria-label="Habit check-in detail"><h2>' + h.e + " " + esc(h.n) + "</h2>" + (h.note ? "<p>" + esc(h.note) + "</p>" : "") + '<label>Check-in date</label><input id="habitdate" type="date" max="' + day() + '" value="' + d + '"><p>' + label + " \xB7 " + (checked ? "Completed" : "Not checked in") + (checked ? " \xB7 " + run + " day streak through this date" : "") + '</p><div class="week-mini">' + wk + '</div><div class="row"><button class="sm" data-a="editHabit" data-id="' + h.id + '">Edit habit</button><button class="btn" data-a="hdaytoggle" data-id="' + h.id + '" data-d="' + d + '">' + (checked ? "Undo check-in" : "Mark complete") + '</button></div><button class="text-action" data-a="habitclose">Close</button></section></div>';
  }
  function render() {
    var v = S.tab === "insights" ? insights() : S.tab === "habits" ? habits() : S.tab === "tasks" ? tasks() : S.tab === "goals" ? goals() : S.tab === "profile" ? profilePage() : S.tab === "settings" ? settingsPage() : S.tab === "menu" ? menuPage() : today();
    document.getElementById("app").innerHTML = head() + v + foot() + habitModal() + quickSheet();
    var r = document.documentElement;
    r.dataset.wallpaper = S.wallpaper || "warm";
    r.dataset.font = S.font || "system";
    r.style.setProperty("--accent", S.accent || "#1f9d4d");
    r.style.setProperty("--teal", S.accent || "#1f9d4d");
    r.style.setProperty("--sun", S.accent || "#1f9d4d");
    r.style.setProperty("--btn", S.accent || "#1f9d4d");
    if (!S.theme || S.theme === "system") r.removeAttribute("data-theme");
    else r.dataset.theme = S.theme;
    document.getElementById("nav").innerHTML = [["today", "\u2302", "Today"], ["habits", "\u25CC", "Habits"], ["quick", "\uFF0B", ""], ["tasks", "\u2637", "To-do"], ["menu", "\u2630", "Menu"]].map(function(t) {
      return '<button class="' + (S.tab === t[0] ? "on" : "") + (t[0] === "quick" ? " nav-add" : "") + '" data-a="' + (t[0] === "quick" ? "quick" : "tab") + '" data-id="' + t[0] + '"><span>' + t[1] + "</span>" + (t[2] ? "<small>" + t[2] + "</small>" : "") + "</button>";
    }).join("");
    if (quickOpen) {
      var qi = document.getElementById("qtitle");
      if (qi) qi.focus();
    }
  }
  function find(a, id) {
    return S[a].filter(function(x) {
      return x.id === id;
    })[0];
  }
  function after() {
    save();
    render();
  }
  function checkDone(old) {
    var n = pct();
    if (old < 100 && n === 100) toast("\u{1F389} Day cleared! Great work.");
  }
  document.addEventListener("click", function(e) {
    var b = e.target.closest("[data-a]");
    if (!b) return;
    var a = b.dataset.a, id = b.dataset.id, o = pct();
    if (a !== "profilemenu") profileOpen = false;
    if (a === "tab") {
      S.tab = id;
      arm = null;
      return after();
    }
    if (a === "quick") {
      quickOpen = ["task", "habit", "goal", "newProfile"].indexOf(id) >= 0 ? id : S.tab === "habits" ? "habit" : S.tab === "goals" ? "goal" : "task";
      editItem = null;
      return render();
    }
    if (a === "quickclose") {
      if (e.target === b || b.tagName === "BUTTON") {
        quickOpen = "";
        editItem = null;
        return render();
      }
      return;
    }
    if (a === "editTask" || a === "editHabit" || a === "editGoal") {
      quickOpen = a;
      editItem = id;
      habitDetail = null;
      return render();
    }
    if (a === "editProfile") {
      quickOpen = "editProfile";
      editItem = S.activeProfile;
      return render();
    }
    if (a === "switchProfile") {
      var sp = S.profiles.find(function(x) {
        return x.id === id;
      });
      if (sp) {
        S.activeProfile = sp.id;
        S.tasks = sp.tasks;
        S.habits = sp.habits;
        S.goals = sp.goals;
        viewDay = day();
        return after();
      }
    }
    if (a === "accent") {
      S.accent = id;
      return after();
    }
    if (a === "wallpaper") {
      S.wallpaper = id;
      return after();
    }
    if (a === "profilemenu") {
      profileOpen = !profileOpen;
      return render();
    }
    if (a === "habitclose") {
      if (e.target === b || b.tagName === "BUTTON") {
        habitDetail = null;
        return render();
      }
      return;
    }
    if (a === "hdaydetail") {
      habitDetail = { id, date: b.dataset.d };
      return render();
    }
    if (a === "streakdetail") {
      habitDetail = { id, date: day() };
      return render();
    }
    if (a === "hdaytoggle") {
      var hd = find("habits", id), hk = b.dataset.d, hi = hd.log.indexOf(hk);
      if (hi >= 0) hd.log.splice(hi, 1);
      else hd.log.push(hk);
      save();
      render();
      toast(hi >= 0 ? "Check-in removed" : "Habit checked in");
      return;
    }
    if (a === "tog") {
      var t = find("tasks", id), was = t.doneOn === viewDay || !t.doneOn && t.done && t.on === viewDay;
      t.doneOn = was ? null : viewDay;
      t.done = !!t.doneOn;
      t.on = t.doneOn;
      if (t.doneOn) cancelReminder(t);
      else if (t.due) scheduleReminder(t, t.due);
      after();
      return checkDone(o);
    }
    if (a === "star") {
      var t2 = find("tasks", id);
      t2.star = !t2.star;
      return after();
    }
    if (a === "arm") {
      arm = id;
      render();
      return setTimeout(function() {
        if (arm === id) {
          arm = null;
          render();
        }
      }, 3e3);
    }
    if (a === "del") {
      cancelReminder(find("tasks", id));
      S.tasks = S.tasks.filter(function(x) {
        return x.id !== id;
      });
      arm = null;
      quickOpen = "";
      editItem = null;
      return after();
    }
    if (a === "delg") {
      S.goals = S.goals.filter(function(x) {
        return x.id !== id;
      });
      arm = null;
      quickOpen = "";
      editItem = null;
      return after();
    }
    if (a === "delh") {
      S.habits = S.habits.filter(function(x) {
        return x.id !== id;
      });
      arm = null;
      quickOpen = "";
      editItem = null;
      return after();
    }
    if (a === "hab" || a === "hday") {
      var h = find("habits", id), k = b.dataset.d || viewDay, i = h.log.indexOf(k);
      if (i >= 0) {
        h.log.splice(i, 1);
        toast("Habit check-in removed");
      } else {
        h.log.push(k);
        var s = streak(h);
        toast(k === day() ? "\u{1F525} " + s + " day streak \xB7 " + h.n : "Habit checked for " + k);
      }
      after();
      return checkDone(o);
    }
    if (a === "gp") {
      var g = find("goals", id);
      g.prog++;
      after();
      if (g.prog === g.target) toast("\u{1F3C6} Goal reached: " + g.t);
      return;
    }
    if (a === "gm") {
      var g2 = find("goals", id);
      g2.prog = Math.max(0, g2.prog - 1);
      return after();
    }
    if (a === "theme") {
      var r = document.documentElement, dk = r.dataset.theme ? r.dataset.theme === "dark" : matchMedia("(prefers-color-scheme:dark)").matches;
      S.theme = dk ? "light" : "dark";
      save();
      render();
      return;
    }
    if (a === "dayprev" || a === "daynext") {
      var vd = /* @__PURE__ */ new Date(viewDay + "T12:00:00");
      vd.setDate(vd.getDate() + (a === "dayprev" ? -1 : 1));
      if (day(vd) <= day()) viewDay = day(vd);
      return render();
    }
    if (a === "profilerem") {
      if (S.profiles.length < 2) {
        toast("Keep at least one profile");
        return;
      }
      if (confirm("Remove " + profile().name + " and their tasks, habits, and goals?")) {
        S.profiles = S.profiles.filter(function(p) {
          return p.id !== S.activeProfile;
        });
        var np = S.profiles[0];
        S.activeProfile = np.id;
        S.tasks = np.tasks;
        S.habits = np.habits;
        S.goals = np.goals;
        viewDay = day();
        profileOpen = false;
        after();
      }
      return;
    }
    if (a === "daytoday") {
      viewDay = day();
      return render();
    }
    if (a === "exp") {
      var txt = JSON.stringify(S);
      (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(function() {
        toast("Backup copied. Paste it somewhere safe.");
      }, function() {
        prompt("Copy your backup:", txt);
      });
      return;
    }
    if (a === "imp") {
      var v = prompt("Paste your backup here:");
      if (v) {
        try {
          var d = JSON.parse(v);
          if (d.tasks && d.habits && d.goals) {
            S = d;
            if (!Array.isArray(S.profiles) || !S.profiles.length) {
              var pid2 = uid();
              S.profiles = [{ id: pid2, name: "Guest", tasks: S.tasks, habits: S.habits, goals: S.goals }];
              S.activeProfile = pid2;
            }
            var ap = S.profiles.find(function(x) {
              return x.id === S.activeProfile;
            }) || S.profiles[0];
            S.activeProfile = ap.id;
            S.tasks = ap.tasks || [];
            S.habits = ap.habits || [];
            S.goals = ap.goals || [];
            rollover();
            after();
            toast("Backup restored");
          } else throw 0;
        } catch (x) {
          toast("That backup is not valid");
        }
      }
      return;
    }
    if (a === "inst" && deferred) {
      deferred.prompt();
      deferred = null;
      render();
    }
  });
  document.addEventListener("submit", function(e) {
    e.preventDefault();
    var f = e.target.dataset.f;
    if (f === "quickTask") {
      var qt = document.getElementById("qtitle").value.trim();
      if (!qt) return;
      var due = document.getElementById("qdue").value, nt = { id: uid(), t: qt, note: document.getElementById("qnote").value.trim(), done: false, star: false, createdOn: document.getElementById("qdate").value || viewDay };
      S.tasks.push(nt);
      quickOpen = "";
      after();
      if (due) scheduleReminder(nt, due);
      return;
    }
    if (f === "editTask") {
      var et = find("tasks", editItem), etitle = document.getElementById("qtitle").value.trim();
      if (!et || !etitle) return;
      var ndue = document.getElementById("qdue").value;
      if (et.due !== ndue) {
        cancelReminder(et);
        et.reminderId = null;
      }
      et.t = etitle;
      et.note = document.getElementById("qnote").value.trim();
      et.createdOn = document.getElementById("qdate").value || et.createdOn;
      if (ndue) {
        et.due = ndue;
        scheduleReminder(et, ndue);
      } else et.due = "";
      quickOpen = "";
      editItem = null;
      after();
      return;
    }
    if (f === "quickHabit") {
      var hn = document.getElementById("qtitle").value.trim();
      if (!hn) return;
      S.habits.push({ id: uid(), n: hn, e: document.getElementById("qicon").value.trim() || "\u2728", note: document.getElementById("qnote").value.trim(), log: [] });
      quickOpen = "";
      return after();
    }
    if (f === "editHabit") {
      var eh = find("habits", editItem), ehn = document.getElementById("qtitle").value.trim();
      if (!eh || !ehn) return;
      eh.n = ehn;
      eh.e = document.getElementById("qicon").value.trim() || eh.e;
      eh.note = document.getElementById("qnote").value.trim();
      quickOpen = "";
      editItem = null;
      return after();
    }
    if (f === "quickGoal") {
      var qgn = document.getElementById("qtitle").value.trim(), qgt = parseInt(document.getElementById("qtarget").value, 10), qgp = document.getElementById("qperiod").value;
      if (!qgn || !(qgt > 0)) {
        toast("Add a goal name and target");
        return;
      }
      S.goals.push({ id: uid(), t: qgn, target: qgt, p: qgp, prog: 0, note: document.getElementById("qnote").value.trim(), key: key(qgp), hist: 0 });
      quickOpen = "";
      return after();
    }
    if (f === "editGoal") {
      var eg = find("goals", editItem), egt = document.getElementById("qtitle").value.trim(), egtarget = parseInt(document.getElementById("qtarget").value, 10), egp = document.getElementById("qperiod").value;
      if (!eg || !egt || !(egtarget > 0)) {
        toast("Add a goal name and target");
        return;
      }
      if (eg.p !== egp) {
        eg.p = egp;
        eg.prog = 0;
        eg.key = key(egp);
      }
      eg.t = egt;
      eg.target = egtarget;
      eg.note = document.getElementById("qnote").value.trim();
      quickOpen = "";
      editItem = null;
      return after();
    }
    if (f === "editProfile" || f === "renameProfile" || f === "newProfile") {
      var pn = document.getElementById("qtitle").value.trim();
      if (!pn) return;
      if (f === "editProfile") profile().name = pn.slice(0, 32);
      else if (f === "renameProfile") {
        var rp = S.profiles.find(function(p2) {
          return p2.id === editItem;
        });
        if (rp) rp.name = pn.slice(0, 32);
      } else {
        var np = { id: uid(), name: pn.slice(0, 32), tasks: [], habits: [], goals: [] };
        S.profiles.push(np);
        S.activeProfile = np.id;
        S.tasks = np.tasks;
        S.habits = np.habits;
        S.goals = np.goals;
      }
      quickOpen = "";
      editItem = null;
      return after();
    }
    if (f === "task") {
      var v = document.getElementById("nt").value.trim();
      if (!v) return;
      var due = document.getElementById("ndue").value, ntask = { id: uid(), t: v, done: false, star: false, createdOn: viewDay };
      S.tasks.push(ntask);
      quickOpen = false;
      after();
      if (due) scheduleReminder(ntask, due);
    }
    if (f === "habit") {
      var n = document.getElementById("nh").value.trim();
      if (!n) return;
      S.habits.push({ id: uid(), n, e: EM[S.habits.length % EM.length], log: [] });
      after();
    }
    if (f === "profile") {
      var name = document.getElementById("newprofile").value.trim();
      if (!name) return;
      var np = { id: uid(), name: name.slice(0, 32), tasks: [], habits: [], goals: [] };
      S.profiles.push(np);
      S.activeProfile = np.id;
      S.tasks = np.tasks;
      S.habits = np.habits;
      S.goals = np.goals;
      viewDay = day();
      profileOpen = false;
      after();
    }
    if (f === "goal") {
      var t = document.getElementById("gt").value.trim(), n2 = parseInt(document.getElementById("gn").value, 10), p = document.getElementById("gp").value;
      if (!t || !(n2 > 0)) {
        toast("Add a title and a target number");
        return;
      }
      S.goals.push({ id: uid(), t, p, target: n2, prog: 0, key: key(p), hist: 0 });
      after();
    }
  });
  window.addEventListener("beforeinstallprompt", function(e) {
    e.preventDefault();
    deferred = e;
    render();
  });
  document.addEventListener("change", function(e) {
    if (e.target.id === "themechoice") {
      S.theme = e.target.value;
      return after();
    }
    if (e.target.id === "fontchoice") {
      S.font = e.target.value;
      return after();
    }
    if (e.target.id === "habitdate") {
      var v = e.target.value;
      if (v && v <= day()) {
        habitDetail.date = v;
        return render();
      }
      toast("Choose today or an earlier day");
      return render();
    }
    if (e.target.id === "viewday") {
      var v = e.target.value;
      if (v && v <= day()) {
        viewDay = v;
        render();
      } else {
        toast("Choose today or an earlier day");
        render();
      }
    }
  });
  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") {
      if (profileOpen || habitDetail) {
        profileOpen = false;
        habitDetail = null;
        render();
      }
    }
  });
  document.addEventListener("visibilitychange", function() {
    if (!document.hidden) {
      rollover();
      render();
    }
  });
  if ("serviceWorker" in navigator && !window.Capacitor) {
    window.addEventListener("load", function() {
      navigator.serviceWorker.register("sw.js").catch(function() {
      });
    });
  }
  render();
})();
/*! Bundled license information:

@capacitor/core/dist/index.js:
  (*! Capacitor: https://capacitorjs.com/ - MIT License *)
*/
