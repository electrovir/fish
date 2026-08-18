import {css, defineElement, html} from 'element-vir';

export const FishGameHud = defineElement<{
    defeatedSharkCount: number;
}>()({
    tagName: 'fish-game-hud',
    styles: css`
        :host {
            box-sizing: border-box;
            color: #effcff;
            display: block;
            font-family: 'Atkinson Hyperlegible Next', ui-sans-serif, system-ui, sans-serif;
            font-size: clamp(12px, 1.6vw, 16px);
            font-weight: 800;
            top: 0;
            left: 0;
            display: flex;
            flex-direction: column;
            pointer-events: none;
            position: absolute;
            z-index: 1;
            padding: 16px;
        }

        .cleared {
            display: flex;
            align-items: center;
            gap: 4px;

            & .cleared-count {
                color: #ffd771;
                font-size: 1.45em;
            }
        }

        .depth {
            color: #dcfaff;
            font-family: ui-monospace, 'SFMono-Regular', monospace;
            font-weight: 400;
        }
    `,
    render({inputs}) {
        return html`
            <div class="cleared">
                <span>SHARKS CLEARED:</span>
                <span class="cleared-count">${inputs.defeatedSharkCount}</span>
            </div>
            <span class="depth">DEPTH ${24 + inputs.defeatedSharkCount * 14} M</span>
        `;
    },
});
