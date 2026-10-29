'use strict';

/* Bảng thật của Discord Display Name Styles — port thuần từ
   electron/displayNameStyle.js (cùng số liệu, không tự chế). */
(function () {
	const FONTS = {
		3: { className: 'cherryBomb', family: 'Sakura', weight: 400, letterSpacing: '0.04em', file: '33d4f12a85e1f736' },
		4: { className: 'chicle', family: 'Jellybean', weight: 400, letterSpacing: '', file: 'e6f5f44abb520735' },
		6: { className: 'museoModerno', family: 'Modern', weight: 500, letterSpacing: '0.01em', file: 'c560709c3470bb66' },
		7: { className: 'neoCastel', family: 'Medieval', weight: 400, letterSpacing: '0.02em', file: '52b541f86401a5b6' },
		8: { className: 'pixelify', family: '8Bit', weight: 400, letterSpacing: '0.02em', file: '69c735ca5c604de7' },
		10: { className: 'sinistre', family: 'Vampyre', weight: 400, letterSpacing: '0.01em', file: '8f20cb550d739cea' },
		12: { className: 'zillaSlab', family: 'Tempo', weight: 600, letterSpacing: '0.03em', file: '27b34a77ba5d693e' },
		13: { className: 'playpenSans', family: 'Monkey Bars', weight: 700, letterSpacing: '', file: '45ef50dce38a931a' },
		14: { className: 'orbitron', family: 'Mainframe', weight: 700, letterSpacing: '0.03em', file: '4841dace333e9054' },
		15: { className: 'newRocker', family: 'Headbang', weight: 400, letterSpacing: '', file: 'c00df4f25667809b' },
		16: { className: 'kalam', family: 'Journal', weight: 700, letterSpacing: '', file: 'aa59ae54ce7e540a' },
		17: { className: 'pricedown', family: 'Pricedown', weight: 700, letterSpacing: '', file: 'a7bafac436428e6c' },
	};
	const EFFECTS = {
		1: { key: 'solid', minRatio: 3 },
		2: { key: 'gradient', minRatio: 2.5 },
		3: { key: 'neon', minRatio: 3 },
		4: { key: 'toon', minRatio: 3 },
		5: { key: 'pop', minRatio: 3 },
		6: { key: 'gradient', minRatio: 2.5 },
		7: { key: 'prism', minRatio: 2.5 },
		8: { key: 'gummy', minRatio: 3 },
	};
	const MAX_COLORS = { 1: 1, 2: 2, 3: 1, 4: 1, 5: 1, 6: 2, 7: 5, 8: 4 };

	function intToHex(n) {
		const v = Number(n);
		if (!Number.isFinite(v)) return '';
		return '#' + (v >>> 0).toString(16).padStart(6, '0').slice(-6);
	}

	function pickStyle(user) {
		if (!user || typeof user !== 'object') return null;
		const nested = user.display_name_styles || user.displayNameStyles || null;
		let fontId = null;
		let effectId = null;
		let colors = [];
		if (nested && typeof nested === 'object') {
			fontId = nested.font_id != null ? nested.font_id : nested.fontId != null ? nested.fontId : null;
			effectId = nested.effect_id != null ? nested.effect_id : nested.effectId != null ? nested.effectId : null;
			colors = Array.isArray(nested.colors) ? nested.colors : [];
		} else if (user.display_name_font_id != null || user.display_name_effect_id != null) {
			fontId = user.display_name_font_id != null ? user.display_name_font_id : null;
			effectId = user.display_name_effect_id != null ? user.display_name_effect_id : null;
			colors = Array.isArray(user.display_name_colors) ? user.display_name_colors : [];
		}
		if (fontId == null && effectId == null) return null;
		return {
			fontId: Number(fontId) || 0,
			effectId: Number(effectId) || 0,
			colors: colors.map((c) => (typeof c === 'number' ? intToHex(c) : String(c))).filter(Boolean),
		};
	}

	function buildDescriptor(style, displayName) {
		if (!style) return { ok: false, error: 'tài khoản không đặt kiểu tên hiển thị' };
		const effect = EFFECTS[style.effectId] || EFFECTS[1];
		const font = FONTS[style.fontId] || null;
		const maxN = MAX_COLORS[style.effectId] || 1;
		const colors = (style.colors || []).slice(0, maxN);
		return {
			ok: true,
			at: Date.now(),
			text: String(displayName || ''),
			font: font
				? {
						id: style.fontId,
						className: font.className,
						family: font.family,
						weight: font.weight,
						letterSpacing: font.letterSpacing,
						hasFile: !!font.file,
					}
				: { id: style.fontId, className: '', family: '', weight: 0, letterSpacing: '', hasFile: false },
			effect: effect.key,
			effectId: style.effectId,
			minRatio: effect.minRatio,
			colors: colors,
			raw: style,
		};
	}

	window.AQDisplayName = {
		FONTS: FONTS,
		EFFECTS: EFFECTS,
		pickStyle: pickStyle,
		buildDescriptor: buildDescriptor,
		intToHex: intToHex,
	};
})();
