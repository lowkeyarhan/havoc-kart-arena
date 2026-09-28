# Visual direction

Primary concept: `lobby-concept.png`, generated with the built-in image-generation tool. Prompt: a complete HAVOC browser kart combat lobby with a cinematic golden canyon, a lime open kart, charcoal surfaces, lime accents, condensed italic display typography, quick play, room joining and three arena thumbnails.

Production art: `../public/assets/arenas.png`, generated with the built-in image-generation tool. Prompt: three stacked, unlabelled photorealistic environment panoramas: golden sandstone canyon, snowy alpine ridge and a rainy neon cargo port. The image is used only for the arena picker. The actual game uses real-time 3D meshes with photographic ground/rock textures.

Tokens: background #121613, accent #c4f564, main text #f3f4ee, muted text #b1b8b0. Display typography is Barlow Condensed Black Italic; body typography is Barlow. Controls use subtle borders, small radii and native HTML. Dialogs use the same palette and typography.

Intentional differences from concept: actual 3D kart and scenery replace the illustrative render so all angles and game motion work; guest profile is local; no rank or account system; small arena selection headings improve discoverability. All names, controls, weather labels and game HUD are real HTML. Browser-generated minimap and particles are dynamic game visuals.

The deliverable is the local runnable game with a production server, not a publicly hosted service.

## Verification

Verified the rendered lobby at 1536 by 1024, mobile layout at 390 by 844, and quick-play match with agent-browser because no built-in Browser tool was available. Inspected both the concept and the final desktop capture with view_image. No browser JavaScript errors were reported. Compared the headline and play/create/join copy, left-panel and bottom-rail layout, condensed italic typography, charcoal/lime palette, and arena-art framing. Enlarged the live kart and reduced excessive bloom after the first comparison. The rendered geometry remains visibly simpler than the photorealistic concept; photorealism fidelity is not claimed. Above-the-fold copy differences are the arena headings, E/boost hint, local profile status and more precise weather labels described above. Mobile fits without horizontal overflow.

The production build and one runnable simulation regression pass. Two independent WebSocket clients joined the same private alpine room and observed the same server-authoritative driving movement. Quick play entered a live match with five explicitly identified bots. Temporary verification captures are outside the repository.
