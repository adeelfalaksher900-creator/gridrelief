# Hubmorrow demonstration video

Target: 1920 × 1080 MP4, approximately 2 minutes 30 seconds, simple English narration and readable captions. At least 85% of screen time should show real interactions with the deployed application. No final video has been produced yet.

## Recording and editing plan

| Beat | Real product evidence | Narration / message |
| --- | --- | --- |
| 1 · Problem | Initial sample plan, eight batteries and six hubs | A community can have several hubs but only a few backup batteries. Equal counts do not mean equal service. |
| 2 · Needs | Open Northside editor, change phone/internet load to 0.5 kW, save | Start with what each hub needs: communication, refrigeration, cooling and lighting. Add its solar capacity, expected occupancy and priority. |
| 3 · Resources | Battery count, storage, output, reserve and efficiency controls | Set the batteries you have and how long the outage may last. Power limits matter as well as stored energy. |
| 4 · Calculate | Change duration and press Calculate; show actual changed result | Hubmorrow checks whole-pack choices, calculates hourly supply and assigns the available batteries. |
| 5 · Explain | Open allocation explanations | Each assignment has a reason. Some hubs need batteries to meet the minimum; another may already meet it with solar. |
| 6 · Gaps | Energy chart and unmet kWh | A plan is useful when it shows what it cannot cover. The chart makes gaps visible instead of hiding them. |
| 7 · Test | Three stress cases and same-floor round-robin comparison | Keep the batteries in place and test less sun or a longer outage. A higher priority score can still supply less total energy. Compare both. |
| 8 · Reproduce | Save, restore, copy JSON, import and recalculate | Save a plan in this browser. Export or copy the inputs, then import them to calculate the same plan again. |
| 9 · Trust | Method, sample-data notice and forecast provenance | Starting hub values are sample data. Optional Open-Meteo weather records its source and date. Real use still needs measured loads and professional review. |
| 10 · Close | Actual live URL and repository link | Hubmorrow. Backup power, planned. A clear decision to review before an outage. |

## Hyperframes visual identity

Use the product's warm canvas #f5f6f4, forest action color #194f3d, ink #1c2927 and supporting text #52674c. Use its original H mark. Keep recorded UI unobscured; use short step labels in the outer margin. Titles 64 px or larger, captions 28 px or larger. Use restrained crossfades and transform/opacity motion. No invented cursor actions or generated application screens. Match narration to actual recording timestamps.

Before delivery: lint, runtime validation, layout inspection, spot-check exported frames, confirm 1920 × 1080 encoding and audio sync, and watch the whole video. The participant will upload the video to YouTube and supply the link. Do not enter a fabricated URL or final-submit the Devpost project.

## Production record

The participant requested frame-based Hyperframes production and ElevenLabs narration. One 107.886-second English narration was generated using 1722 credits. Scribe returned timestamped words without an additional estimated credit cost. The timeline has 27 scenes, 39 caption groups and a 112-second, 1920 × 1080, 30 fps target (3360 output frames).

Source frames are genuine interactions captured through the connected Chrome Browser API. Native navigation, hub editing, calculation, infeasibility, forecast loading/reset, saved plans and clipboard import/export were exercised. No generated interface or invented result is used. The edit uses framing and crossfades while preserving the application pixels.

Hyperframes CLI 0.8.188 and FFmpeg are installed. The default Chrome download failed, so the official @sparticuz/chromium 148.0.0 npm package supplies the local renderer. Its packaged font configuration pointed to missing Lambda paths; system font configuration is used for the final render. Final export is complete: H.264/AAC MP4, 1920 × 1080, 30 fps, 112 seconds, 3360 video frames, 20,128,003 bytes. FFmpeg decoded the complete video and audio without errors. All 27 scene midpoints were reviewed in a contact sheet. Runtime, layout and motion checks passed, and all 18 sampled text contrast checks passed. One lint warning reflects intentional reuse of the same real capture in two scenes.
