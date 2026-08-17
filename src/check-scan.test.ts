import assert from "node:assert/strict";
import test from "node:test";

import { BRANDS, SCAN_FILTERS, buildDiscordSummary, type DeviceResult } from "./check-scan.ts";

function result(overrides: Partial<DeviceResult> & { device: HIDDevice }): DeviceResult {
  return {
    brand: "Xenta / Attack Shark",
    vendorId: 0x1d57,
    productId: 0xfa60,
    openmouseSupported: true,
    isRazer: false,
    opened: true,
    openError: null,
    verdict: "unknown",
    verdictNote: "No collections visible — interface may be blocked",
    txResults: [],
    ...overrides,
  };
}

test("both Attack Shark vendor ids are scannable", () => {
  // 0x1D57 is the Xenta OEM behind the R1 and X11; 0x25A7 the X3, X6, and
  // direct-connect X11. Missing either leaves the mouse out of the prompt.
  for (const vendorId of [0x1d57, 0x25a7]) {
    assert.ok(BRANDS[vendorId], `no brand name for VID 0x${vendorId.toString(16)}`);
    assert.ok(
      SCAN_FILTERS.some((filter) => filter.vendorId === vendorId),
      `no scan filter for VID 0x${vendorId.toString(16)}`,
    );
  }
});

test("the shared summary carries the product id and each collection's reports", () => {
  const device = {
    productName: "2.4G Wireless Device",
    collections: [
      { usagePage: 0x000c, usage: 0x01, inputReports: [{}], outputReports: [], featureReports: [] },
      { usagePage: 0xff00, usage: 0x01, inputReports: [], outputReports: [], featureReports: [{}] },
    ],
  } as unknown as HIDDevice;

  const summary = buildDiscordSummary([result({ device })]);

  assert.match(summary, /PID_FA60/);
  // Which collection owns the feature reports is the whole question when a
  // mouse offers several identically named entries in the prompt.
  assert.match(summary, /Consumer usage 0x01 — 1× input/);
  assert.match(summary, /Vendor \(0xFF00\) usage 0x01 — 1× feature/);
});
