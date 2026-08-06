/*! coi-serviceworker v0.1.7 - Guido Zuidhof and contributors, licensed under MIT */
let coepCredentialless = false
if (typeof window === "undefined") {
  self.addEventListener("install", () => self.skipWaiting())
  self.addEventListener("activate", (event) =>
    event.waitUntil(self.clients.claim())
  )

  self.addEventListener("message", (ev) => {
    if (!ev.data) {
      return
    } else if (ev.data.type === "deregister") {
      self.registration
        .unregister()
        .then(() => {
          return self.clients.matchAll()
        })
        .then((clients) => {
          clients.forEach((client) => client.navigate(client.url))
        })
    } else if (ev.data.type === "coepCredentialless") {
      coepCredentialless = ev.data.value
    }
  })

  self.addEventListener("fetch", function (event) {
    const r = event.request
    if (r.cache === "only-if-cached" && r.mode !== "same-origin") {
      return
    }

    const request =
      coepCredentialless && r.mode === "no-cors"
        ? new Request(r, {
            credentials: "omit",
          })
        : r
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 0) {
            return response
          }

          const newHeaders = new Headers(response.headers)
          newHeaders.set(
            "Cross-Origin-Embedder-Policy",
            coepCredentialless ? "credentialless" : "require-corp"
          )
          if (!coepCredentialless) {
            newHeaders.set("Cross-Origin-Resource-Policy", "cross-origin")
          }
          newHeaders.set("Cross-Origin-Opener-Policy", "same-origin")

          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders,
          })
        })
        .catch((e) => {
          // Dev-only noise: when the dev server restarts / HMR triggers,
          // the fetch races the page load and fails with benign errors like
          // "Failed to convert value to 'Response'". Don't spam the console.
          if (
            e instanceof TypeError &&
            /Failed to convert value to 'Response'|Failed to fetch/.test(
              String(e)
            )
          ) {
            return
          }
          console.error(e)
        })
    )
  })
} else {
  ;(() => {
    const reloadedBySelf = window.sessionStorage.getItem("coiReloadedBySelf")
    window.sessionStorage.removeItem("coiReloadedBySelf")
    const coepDegrading = reloadedBySelf == "coepdegrade"

    // Persistent one-shot guard: the reload dance may only run once per
    // browser. Chrome can kill and restore tabs under memory pressure,
    // which clears sessionStorage; without this guard the page can reload
    // forever (restore -> reload -> memory spike -> kill -> restore...).
    const reloadAttempted = !!window.localStorage.getItem("coiReloadAttempted")

    // You can customize the behavior of this script through a global `coi` variable.
    const coi = {
      shouldRegister: () => !reloadedBySelf && !reloadAttempted,
      shouldDeregister: () => false,
      coepCredentialless: () => true,
      coepDegrade: () => true,
      doReload: () => {
        // Never reload more than once per browser.
        if (reloadAttempted) return
        window.localStorage.setItem("coiReloadAttempted", "1")
        window.location.reload()
      },
      quiet: false,
      ...window.coi,
    }

    const n = navigator
    const controlling = n.serviceWorker && n.serviceWorker.controller

    // Record the failure if the page is served by serviceWorker.
    if (controlling && !window.crossOriginIsolated) {
      window.sessionStorage.setItem("coiCoepHasFailed", "true")
    }
    const coepHasFailed = window.sessionStorage.getItem("coiCoepHasFailed")

    if (controlling) {
      // Reload only on the first failure.
      const reloadToDegrade =
        coi.coepDegrade() && !(coepDegrading || window.crossOriginIsolated)
      n.serviceWorker.controller.postMessage({
        type: "coepCredentialless",
        value:
          reloadToDegrade || (coepHasFailed && coi.coepDegrade())
            ? false
            : coi.coepCredentialless(),
      })
      if (reloadToDegrade) {
        !coi.quiet && console.log("Reloading page to degrade COEP.")
        window.sessionStorage.setItem("coiReloadedBySelf", "coepdegrade")
        coi.doReload("coepdegrade")
      }

      if (coi.shouldDeregister()) {
        n.serviceWorker.controller.postMessage({ type: "deregister" })
      }
    }

    // If we're already coi: do nothing. Perhaps it's due to this script doing its job, or COOP/COEP are
    // already set from the origin server. Also if the browser has no notion of crossOriginIsolated, just give up here.
    if (window.crossOriginIsolated !== false || !coi.shouldRegister()) return

    if (!window.isSecureContext) {
      !coi.quiet &&
        console.log(
          "COOP/COEP Service Worker not registered, a secure context is required.",
          "Current protocol:",
          window.location.protocol,
          "Hostname:",
          window.location.hostname,
          "isSecureContext:",
          window.isSecureContext
        )
      return
    }

    // In some environments (e.g. Firefox private mode) this won't be available
    if (!n.serviceWorker) {
      !coi.quiet &&
        console.error(
          "COOP/COEP Service Worker not registered, perhaps due to private mode."
        )
      return
    }

    n.serviceWorker.register(window.document.currentScript.src).then(
      (registration) => {
        !coi.quiet &&
          console.log("COOP/COEP Service Worker registered", registration.scope)

        registration.addEventListener("updatefound", () => {
          !coi.quiet &&
            console.log(
              "Reloading page to make use of updated COOP/COEP Service Worker."
            )
          window.sessionStorage.setItem("coiReloadedBySelf", "updatefound")
          coi.doReload()
        })

        // If the registration is active, but it's not controlling the page
        if (registration.active && !n.serviceWorker.controller) {
          !coi.quiet &&
            console.log(
              "Reloading page to make use of COOP/COEP Service Worker."
            )
          window.sessionStorage.setItem("coiReloadedBySelf", "notcontrolling")
          coi.doReload()
        }
      },
      (err) => {
        !coi.quiet &&
          console.error("COOP/COEP Service Worker failed to register:", err)
      }
    )
  })()
}
