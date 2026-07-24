import { getRewardProgress } from "../../reward-offers";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { mobile?: string };
    const mobile = body.mobile?.trim() || "";
    if (!/^\d{10}$/.test(mobile))
      return Response.json(
        { error: "Valid 10-digit mobile number daalo" },
        { status: 400 },
      );
    return Response.json(
      { offers: await getRewardProgress(mobile) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Offer progress load nahi hua" },
      { status: 500 },
    );
  }
}
