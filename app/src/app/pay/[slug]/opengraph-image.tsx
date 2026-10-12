import { ImageResponse } from "next/og";
import { createAdminClient } from "@/lib/supabase/admin";
import { isLinkUsable } from "@/lib/payment-link-status";
import { OG, OG_SIZE, OgLogoMark, ogFonts } from "@/lib/og";

export const alt = "Zapeet payment link";
export const size = OG_SIZE;
export const contentType = "image/png";

// Mirrors the checkout page itself: paper background, vendor name, and the
// white item card with price and the same-day delivery pill.
export default async function OpengraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data: link } = await createAdminClient()
    .from("payment_links")
    .select("item_name, amount_naira, status, expires_at, vendor:vendors(business_name)")
    .eq("slug", slug)
    .single();

  const vendor = (link?.vendor as unknown as { business_name: string } | null)?.business_name;
  const usable = link ? isLinkUsable(link) : false;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: OG.paper,
          fontFamily: "Inter",
        }}
      >
        <OgLogoMark size={72} />
        {vendor && (
          <div style={{ display: "flex", marginTop: 16, fontSize: 28, fontWeight: 600, color: OG.ink60 }}>
            from {vendor}
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 36,
            width: 760,
            padding: "44px 52px",
            background: "white",
            borderRadius: 36,
            border: "2px solid rgba(27,31,59,0.1)",
            boxShadow: "0 30px 60px -30px rgba(27,31,59,0.35)",
          }}
        >
          {link && usable ? (
            // Satori ignores fragments' parent direction, so wrap in a column.
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 32, fontWeight: 600, color: OG.ink60 }}>
                {link.item_name.length > 40 ? `${link.item_name.slice(0, 39)}…` : link.item_name}
              </div>
              <div style={{ display: "flex", marginTop: 8, fontSize: 88, fontWeight: 800, color: OG.ink, letterSpacing: -3 }}>
                ₦{Number(link.amount_naira).toLocaleString("en-NG")}
              </div>
              <div style={{ display: "flex", marginTop: 20 }}>
                <div
                  style={{
                    display: "flex",
                    padding: "12px 24px",
                    borderRadius: 999,
                    background: "rgba(242,169,59,0.15)",
                    color: OG.marigoldInk,
                    fontSize: 26,
                    fontWeight: 600,
                  }}
                >
                  Same-day delivery included
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "center", fontSize: 32, fontWeight: 600, color: OG.ink60 }}>
              This payment link isn’t available anymore.
            </div>
          )}
        </div>
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
