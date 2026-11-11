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
  function pad(n) {
    return String(n).padStart(2, "0");
  }
  function day(d) {
    d = d || /* @__PURE__ */ new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  if (!Array.isArray(S.profiles) || !S.profiles.length) {
    pid = uid();
    S.profiles = [{ id: pid, name: "Gagan", tasks: S.tasks || [], habits: S.habits || [], goals: S.goals || [] }];
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
    var t = day(), tasks = S.tasks.filter(function(x) {
      return (x.createdOn || t) <= t && (!x.doneOn || x.doneOn >= t);
    }), b = tasks.filter(function(x) {
      return x.doneOn === t || !x.doneOn && x.done && x.on === t;
    }).length, c = S.habits.length, d = S.habits.filter(function(h) {
      return h.log.indexOf(t) >= 0;
    }).length;
    return tasks.length + c ? Math.round((b + d) / (tasks.length + c) * 100) : 0;
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
    var p = pct(), n = S.tasks.length + S.habits.length, hour = (/* @__PURE__ */ new Date()).getHours(), g = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening", name = profile().name, initial = name.trim().charAt(0).toUpperCase() || "P";
    var panel = profileOpen ? '<div class="profile-panel"><h3>Switch profile</h3><select id="profilepick" aria-label="Active profile">' + S.profiles.map(function(p2) {
      return '<option value="' + p2.id + '"' + (p2.id === S.activeProfile ? " selected" : "") + ">" + esc(p2.name) + "</option>";
    }).join("") + '</select><form data-f="profile"><input id="newprofile" placeholder="New profile name" maxlength="32" autocomplete="off"><button class="btn">Add</button></form>' + (S.profiles.length > 1 ? '<button class="profile-remove" data-a="profilerem">Remove current profile</button>' : "") + "</div>" : "";
    return '<div class="top"><div><div class="eyebrow">MOMENTUM \xB7 TODAY</div><h1>' + g + ", " + esc(name) + "</h1><p>" + msg(p, n) + '</p></div><button class="profile-btn" data-a="profilemenu" aria-label="Profiles"><span class="avatar">' + esc(initial) + '</span><span class="profile-name">' + esc(name) + "</span><span>\u2304</span></button>" + panel + '</div><div class="progress-strip"><span>Today\u2019s progress</span><b>' + p + '%</b></div><div class="progress"><i style="width:' + p + '%"></i></div>';
  }
  function taskRow(x, done) {
    return '<div class="task' + (done ? " done" : "") + '"><button class="chk" data-a="tog" data-id="' + x.id + '" aria-label="Toggle task">' + (done ? "\u2713" : "") + '</button><span class="tt">' + esc(x.t) + (x.due ? '<small class="hint"> \xB7 \u{1F514} ' + esc(x.due.replace("T", " ")) + "</small>" : "") + '</span><button class="ic' + (x.star ? " star" : "") + '" data-a="star" data-id="' + x.id + '" aria-label="Priority">' + (x.star ? "\u2605" : "\u2606") + "</button>" + (arm === x.id ? '<button class="arm" data-a="del" data-id="' + x.id + '">Delete?</button>' : '<button class="ic" data-a="arm" data-id="' + x.id + '" aria-label="Delete">\u2715</button>') + "</div>";
  }
  function today() {
    var t = viewDay, o = "";
    o += '<form class="add" data-f="task"><input id="nt" placeholder="Add a task\u2026" maxlength="120" autocomplete="off"><button class="btn">Add</button><details><summary class="hint">\uFF0B Add reminder</summary><input id="ndue" type="datetime-local" aria-label="Reminder date and time"></details></form>';
    if (S.habits.length) {
      o += '<div class="sec">Daily habits</div><div class="chips">' + S.habits.map(function(h) {
        var on = h.log.indexOf(t) >= 0, s = streak(h);
        return '<button class="chip' + (on ? " on" : "") + '" data-a="hab" data-id="' + h.id + '">' + h.e + " " + esc(h.n) + ' <span class="fl">\u{1F525}' + s + "</span></button>";
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
    }).join("") : done.length ? "" : '<div class="empty">Nothing planned. Add one small task above.</div>') + (done.length ? '<details class="completed-group"><summary>Completed \xB7 ' + done.length + "</summary>" + done.map(function(x) {
      return taskRow(x, true);
    }).join("") + "</details>" : "") + "</div>";
    return o;
  }
  function goals() {
    var o = '<div class="sec">Goals</div><form class="form" data-f="goal"><input id="gt" placeholder="New goal, e.g. Read books" maxlength="80"><input id="gn" type="number" min="1" placeholder="Target" inputmode="numeric"><select id="gp"><option value="week">Weekly</option><option value="month" selected>Monthly</option><option value="year">Yearly</option></select><button class="btn">Add</button></form>';
    ["week", "month", "year"].forEach(function(p) {
      var l = S.goals.filter(function(g) {
        return g.p === p;
      });
      if (!l.length) return;
      o += '<div class="sec">' + PL[p] + "</div>";
      l.forEach(function(g) {
        var r = Math.min(100, Math.round(g.prog / g.target * 100)), hit = g.prog >= g.target;
        o += '<div class="card' + (hit ? " hit" : "") + '"><div class="row"><span class="gt">' + esc(g.t) + (hit ? " \u{1F3C6}" : "") + "</span>" + (arm === g.id ? '<button class="arm" data-a="delg" data-id="' + g.id + '">Delete?</button>' : '<button class="ic" data-a="arm" data-id="' + g.id + '" aria-label="Delete goal">\u2715</button>') + '</div><div class="bar"><i style="width:' + r + '%"></i></div><div class="row"><span class="sub">' + g.prog + " of " + g.target + " (" + r + "%)" + (g.hist ? " \xB7 hit " + g.hist + "x before" : "") + '</span><span><button class="sm" data-a="gm" data-id="' + g.id + '" aria-label="Minus one">\u22121</button> <button class="sm" data-a="gp" data-id="' + g.id + '" aria-label="Plus one">+1</button></span></div></div>';
      });
    });
    if (!S.goals.length) o += '<div class="card empty">Set a weekly, monthly or yearly target. Tap +1 whenever you make progress.</div>';
    return o;
  }
  function habits() {
    var o = '<div class="sec">Habits <span class="hint">' + S.habits.length + '</span></div><form class="add" data-f="habit"><input id="nh" placeholder="Add a habit\u2026" maxlength="40" autocomplete="off"><button class="btn">Add</button></form>';
    o += S.habits.map(function(h) {
      var s = streak(h), w = "";
      for (var i = 6; i >= 0; i--) {
        var d = /* @__PURE__ */ new Date();
        d.setHours(12, 0, 0, 0);
        d.setDate(d.getDate() - i);
        var k = day(d);
        w += '<button class="dot' + (h.log.indexOf(k) >= 0 ? " on" : "") + (k === day() ? " today" : "") + '" data-a="hdaydetail" data-id="' + h.id + '" data-d="' + k + '" aria-label="Details for ' + k + '"><span>' + "SMTWTFS"[d.getDay()] + "</span><b>" + (h.log.indexOf(k) >= 0 ? "\u2713" : d.getDate()) + "</b></button>";
      }
      return '<div class="card"><div class="row"><div><div class="gt">' + h.e + " " + esc(h.n) + '</div><div class="sub">Best ' + best(h) + " days \xB7 " + h.log.length + ' check-ins</div></div><button class="streak-button" data-a="streakdetail" data-id="' + h.id + '"><b>\u{1F525} ' + s + '</b><span>day streak</span></button></div><div class="week">' + w + '</div><div class="row habit-actions"><span class="hint">Tap a day for details</span>' + (arm === h.id ? '<button class="arm" data-a="delh" data-id="' + h.id + '">Delete?</button>' : '<button class="ic" data-a="arm" data-id="' + h.id + '" aria-label="Delete habit">\u2715</button>') + "</div></div>";
    }).join("");
    if (!S.habits.length) o += '<div class="card empty">Habits build streaks. Add one and tick it each day.</div>';
    return o;
  }
  function foot() {
    return '<div class="foot">' + (deferred ? '<button data-a="inst">Install</button>' : "") + '<button data-a="theme">' + (S.theme === "light" ? "Dark mode" : S.theme === "dark" ? "Light mode" : "Theme") + '</button><button data-a="exp">Backup</button><button data-a="imp">Restore</button></div>';
  }
  function habitModal() {
    if (!habitDetail) return "";
    var h = find("habits", habitDetail.id);
    if (!h) return "";
    var d = habitDetail.date || day(), checked = h.log.indexOf(d) >= 0, dt = /* @__PURE__ */ new Date(d + "T12:00:00"), label = dt.toLocaleDateString(void 0, { weekday: "long", month: "long", day: "numeric" }), run = streakThrough(h, d), wk = "";
    for (var i = 6; i >= 0; i--) {
      var x = /* @__PURE__ */ new Date();
      x.setHours(12, 0, 0, 0);
      x.setDate(x.getDate() - i);
      var k = day(x);
      wk += "<span>" + "SMTWTFS"[x.getDay()] + '<b class="' + (h.log.indexOf(k) >= 0 ? "on" : "") + '">' + (h.log.indexOf(k) >= 0 ? "\u2713" : x.getDate()) + "</b></span>";
    }
    return '<div class="modal-backdrop" data-a="habitclose"><section class="modal" role="dialog" aria-modal="true" aria-label="Habit check-in detail"><h2>' + h.e + " " + esc(h.n) + "</h2><p>" + label + "</p><p><b>" + (checked ? "Completed" : "Not checked in") + "</b>" + (checked ? " \xB7 " + run + " day streak at this date" : "") + '</p><div class="week-mini">' + wk + '</div><div class="row"><button class="sm" data-a="habitclose">Close</button><button class="btn" data-a="hdaytoggle" data-id="' + h.id + '" data-d="' + d + '">' + (checked ? "Undo check-in" : "Mark complete") + "</button></div></section></div>";
  }
  function render() {
    var v = S.tab === "goals" ? goals() : S.tab === "habits" ? habits() : today();
    document.getElementById("app").innerHTML = head() + v + foot() + habitModal();
    if (!S.theme || S.theme === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.dataset.theme = S.theme;
    document.getElementById("nav").innerHTML = [["today", "\u2705", "Today"], ["goals", "\u{1F3AF}", "Goals"], ["habits", "\u{1F525}", "Habits"]].map(function(t) {
      return '<button class="' + (S.tab === t[0] ? "on" : "") + '" data-a="tab" data-id="' + t[0] + '"><span>' + t[1] + "</span>" + t[2] + "</button>";
    }).join("");
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
      return after();
    }
    if (a === "delg") {
      S.goals = S.goals.filter(function(x) {
        return x.id !== id;
      });
      arm = null;
      return after();
    }
    if (a === "delh") {
      S.habits = S.habits.filter(function(x) {
        return x.id !== id;
      });
      arm = null;
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
              S.profiles = [{ id: pid2, name: "Gagan", tasks: S.tasks, habits: S.habits, goals: S.goals }];
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
    if (f === "task") {
      var v = document.getElementById("nt").value.trim();
      if (!v) return;
      var due = document.getElementById("ndue").value, ntask = { id: uid(), t: v, done: false, star: false, createdOn: viewDay };
      S.tasks.push(ntask);
      after();
      if (due) scheduleReminder(ntask, due);
      document.getElementById("nt").focus();
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
    if (e.target.id === "profilepick") {
      var p = S.profiles.find(function(x) {
        return x.id === e.target.value;
      });
      if (p) {
        S.activeProfile = p.id;
        S.tasks = p.tasks;
        S.habits = p.habits;
        S.goals = p.goals;
        viewDay = day();
        profileOpen = false;
        save();
        render();
      }
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
