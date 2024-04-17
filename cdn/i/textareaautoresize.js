(function SetupTextareaAutoResize() {
	'use strict';
	window.GetInnerText = ref => ref.innerText;
	window.GetInnerHtml = ref => ref.innerHtml;
	['input', 'focusin', 'change'].forEach(eventKey => {
		document.body.addEventListener(eventKey, ev => {
			if (!ev.target || ev.target.nodeName !== 'TEXTAREA') { return; }
			autosizeTextArea(ev.target);
		});
	});
	document.body.addEventListener("keydown", (ev) => {
		if (ev.key !== 'Tab') { return; }
		if (!ev.target || ev.target.nodeName !== 'TEXTAREA') { return; }
		ev.preventDefault();
		let el = ev.target;
		let text = el.value;
		let postTab = text.slice(el.selectionEnd, text.length);
		let cursorPos = el.selectionEnd;
		if (ev.shiftKey) {
			let trimCount = 0;
			for (let i = 0; i < 4; ++i) {
				if (text.charAt(cursorPos - 1) === '\t') {
					if (i > 0) { break; }
					--cursorPos;
					break;
				}
				if (text.charAt(cursorPos - 1) === ' ') {
					--cursorPos;
					continue;
				}
				break;
			}
			if (trimCount > 0) {
				ev.target.value = text.slice(0, el.selectionStart - trimCount) + postTab;
			}
		} else {
			ev.target.value = text.slice(0, el.selectionStart) + "\t" + postTab;
			++cursorPos;
		}
		el.selectionStart = cursorPos;
		el.selectionEnd = cursorPos;
	});
	function autosizeTextArea(target) {
		if (target.nodeName !== 'TEXTAREA') { return; }
		setTimeout(() => {
			target.style.height = `0px`;
			let newHeight = target.scrollHeight;
			target.style.height = `${(newHeight)}px`;
		}, 10);
	}
	function UpdateAllDisplayedTextareaSizes() {
		document.querySelectorAll('textarea').forEach(instance => {
			autosizeTextArea(instance);
		});
	}

	// Publicly available helper methods
	window.AutosizeTextarea = autosizeTextArea;
	window.RefreshTextareaSizes = () => {
		// Add slight delay to allow time for DOM rendering to complete
		setTimeout(UpdateAllDisplayedTextareaSizes, 100);
	}

	const startObserving = (domNode) => {
		const observer = new MutationObserver(mutations => {
			mutations.forEach(function (mutation) {
				Array.from(mutation.addedNodes).forEach(el => {
					if (!el.nodeName || el.nodeName !== 'TEXTAREA') return;
					console.log(el);
					autosizeTextArea(el);
				});
			});
		});

		observer.observe(domNode, {
			childList: true,
			attributes: true,
			characterData: true,
			subtree: true,
		});

		return observer;
	};
	startObserving(document.body);
})();
