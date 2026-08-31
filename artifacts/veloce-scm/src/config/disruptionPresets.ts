export type DisruptionSeverity = "warning" | "critical";

export interface DisruptionPreset {
  id: string;
  headline: string;
  body: string;
  severity: DisruptionSeverity;
}

export const M2_DISRUPTIONS: DisruptionPreset[] = [
  {
    id: "none",
    headline: "No active disruption",
    body: "",
    severity: "warning",
  },
  {
    id: "port_delay",
    headline: "Port Congestion — Guangzhou: 14-Day Delay on Cotton Shipments",
    body: "Severe congestion at Guangzhou Nansha terminal has pushed inbound cotton vessel berth wait times to 14 days. Several VeloceWear inbound lots are affected. Factor extended lead times and potential safety stock shortfalls into your production plan.",
    severity: "critical",
  },
  {
    id: "cotton_shortage",
    headline: "Central Asia Drought Cuts Cotton Harvest by 15%",
    body: "An unusually dry season across Uzbekistan and Kazakhstan has reduced regional cotton output by approximately 15%. Spot prices have risen and several suppliers are issuing force-majeure notices on partial quantities. Review your material coverage carefully before finalising production volumes.",
    severity: "critical",
  },
  {
    id: "supplier_quality",
    headline: "Supplier Quality Hold — Audit Failure Freezes One Cotton Lot",
    body: "Your tier-1 cotton supplier has failed a third-party quality audit. The affected lot (est. 8 % of your total cotton allocation) is frozen pending re-inspection. Plan for reduced usable cotton availability until the hold is lifted.",
    severity: "warning",
  },
  {
    id: "currency_volatility",
    headline: "EUR/USD Swing: Import Costs Up ~8% This Quarter",
    body: "A sharp depreciation of the Euro against the US Dollar has increased the landed cost of USD-invoiced material purchases by approximately 8%. Your budget assumptions from Module 1 may no longer hold — consider tightening production quantities to protect margin.",
    severity: "warning",
  },
  {
    id: "transport_strike",
    headline: "Southern Europe Trucking Strike — Inbound Deliveries Disrupted",
    body: "A 72-hour rolling strike by haulage operators in Spain and Portugal is delaying inbound road freight to the Porto campus. Rail alternatives are available but add 3–4 days to delivery windows. Your week-1 material availability should be treated as uncertain.",
    severity: "critical",
  },
  {
    id: "customs_delay",
    headline: "New EU Customs Regulations Add 5-Day Clearance Window",
    body: "Updated EU import-control regulations effective this quarter require additional documentation for non-EU textile shipments, adding an estimated 5 business days to customs clearance. All inbound lots from non-EU suppliers are subject to the new timeline.",
    severity: "warning",
  },
];

export const M3_DISRUPTIONS: DisruptionPreset[] = [
  {
    id: "none",
    headline: "No active disruption",
    body: "",
    severity: "warning",
  },
  {
    id: "dc_capacity",
    headline: "Regional DC Capacity Reduced 20% — Partial Warehouse Outage",
    body: "A sprinkler malfunction at the Central European distribution centre has temporarily reduced usable storage capacity by 20%. Inbound finished-goods receipts are being staged at an overflow facility, adding 1–2 days to outbound processing times for EU store orders.",
    severity: "critical",
  },
  {
    id: "carrier_capacity",
    headline: "Major Carrier Cuts Capacity — Transit Times Extended by 3 Days",
    body: "VeloceWear's primary parcel carrier has reduced EU and NA network capacity by 18% due to fuel surcharge disputes. Expect transit times to increase by 2–3 days on standard service lanes. Review your reorder point and safety stock settings to compensate.",
    severity: "critical",
  },
  {
    id: "trade_tariff",
    headline: "New EU–North America Tariff: +6% on Apparel Shipments",
    body: "A newly enacted trade measure adds a 6% ad-valorem tariff on apparel crossing the EU–North America lane. Your current distribution cost model does not include this surcharge — factor it into your network strategy and shipping mode selection.",
    severity: "warning",
  },
  {
    id: "demand_surge",
    headline: "Viral Marketing Campaign Drives 12% APAC Demand Spike",
    body: "An influencer campaign launched last week has driven an unexpected 12% uplift in APAC store order volumes above forecast. Your inventory replenishment policies were calibrated on base-case demand — consider whether your ROP and Q settings adequately buffer this surge.",
    severity: "warning",
  },
  {
    id: "port_strike",
    headline: "Rotterdam Port Strike — EU Outbound Shipments Delayed",
    body: "Industrial action at the Port of Rotterdam is halting container movements for an estimated 5 days. Outbound shipments serving Northern and Central European stores will be delayed. Consider re-routing through Antwerp or Bremerhaven if time-sensitive.",
    severity: "critical",
  },
  {
    id: "last_mile",
    headline: "Urban Delivery Restrictions Extend Last-Mile Time in Key Cities",
    body: "New low-emission zone regulations in London, Paris, and Amsterdam restrict daytime commercial vehicle access. Last-mile delivery windows for stores in these cities have extended by 1–2 business days. Your service level targets may be harder to hit in these markets.",
    severity: "warning",
  },
];

export const NONE_PRESET_ID = "none";

export function getPresetById(presets: DisruptionPreset[], id: string): DisruptionPreset | undefined {
  return presets.find((p) => p.id === id);
}
