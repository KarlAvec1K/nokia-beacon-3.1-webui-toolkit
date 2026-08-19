// Nokia Beacon 3.1 - read-only client capability inventory
// Run from DevTools while authenticated to the local WebUI.

await (async () => {
  const topo = await fetch(
    "/device_home_network_status_web_app.cgi",
    { credentials: "include", cache: "no-store" }
  ).then(r => r.json());

  const clients = [];

  for (const apGroup of topo?.aps ?? []) {
    for (const ap of Object.values(apGroup)) {
      for (const radio of ap.radios ?? []) {
        for (const ssid of radio.ssids ?? []) {
          for (const clientWrapper of ssid.clients ?? []) {
            for (const client of Object.values(clientWrapper)) {
              const c = client.capabilities ?? {};
              const s = client["sensing-data"] ?? {};

              clients.push({
                band: radio.medium,
                ssid: ssid.ssid,
                mac: client["mac-address"],
                ip: client["ip-address"],
                state: client.state,
                rssi: s["rssi-dbm"],
                txMbps: s["data-rate-tx-kbps"] != null ? Math.round(s["data-rate-tx-kbps"] / 1000) : null,
                rxMbps: s["data-rate-rx-kbps"] != null ? Math.round(s["data-rate-rx-kbps"] / 1000) : null,
                wifi6: c["capable-11ax"],
                wifi7: c["capable-11be"],
                band24: c["capable-24ghz"],
                band5: c["capable-5ghz"],
                band6: c["capable-6ghz"],
                bssTransition: c["capable-bss-transition"],
                radioMeasurement: c["capable-radio-measurement"],
                fastTransition: c["capable-fast-bss-transition"],
                dfs: c["capable-dfs"],
                preferredBand: c["preferred-band"],
                steeringClass: c.category
              });
            }
          }
        }
      }
    }
  }

  console.table(clients);
  return clients;
})();
