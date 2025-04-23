setTimeout(() => {
	'use strict';
	window.tooltipsEnabled = true;
	const Tooltip = document.createElement('div');
	Tooltip.className = 'tooltip closed';
	let capturedElement = null;
	document.body.appendChild(Tooltip);
	let isShowing = false;
	function CloseIfOpen() {
		if (!isShowing) { return; }
		isShowing = false;
		capturedElement = null;
		Tooltip.className = 'tooltip closed';
	}
	function CheckContainersForAriaLabel(target) {
		while (target && target !== target.parentNode) {
			if (!target.getAttribute) {
				target = target.parentNode || target.host;
				continue;
			}
			let title = target.getAttribute('title');
			if (title && title != 'null') {
				target.setAttribute('aria-label', title);
				target.removeAttribute('title');
			} else if (title === 'null') {
				target.removeAttribute('title');
			}
			//if (target.ariaLabel) { return [target, target.ariaLabel]; }
			let ariaLabel = target.getAttribute('aria-label');
			if (ariaLabel) { return [target, ariaLabel]; }
			target = target.parentNode || target.host;
		}
		return [null, null];
	}
	let tooltipDistancePadding = 30;
	document.body.addEventListener('click', CloseIfOpen);
	document.body.addEventListener('input', CloseIfOpen);
	document.body.addEventListener('mouseover', ev => {
		if (!window.tooltipsEnabled) return;
		let [target, display] = CheckContainersForAriaLabel(ev.composedPath()[0]);
		if (!target) { CloseIfOpen(); return; }
		if (target === capturedElement) { return; }
		let client = target.getBoundingClientRect();
		isShowing = true;
		capturedElement = target;
		Tooltip.innerText = display;
		Tooltip.className = 'tooltip open';
		let myposition = {
			x: client.left + (client.width / 2) - (Tooltip.clientWidth / 2),
			y: client.top - tooltipDistancePadding
		};
		if (myposition.x + Tooltip.clientWidth > window.innerWidth) { myposition.x = window.innerWidth - Tooltip.clientWidth - 10; }
		if (myposition.x < 0) { myposition.x = 10; }
		if (myposition.y < 0) { myposition.y = client.top + client.height; }

		Tooltip.style.left = `${myposition.x}px`;
		Tooltip.style.top = `${myposition.y}px`;
	});
}, 1000);
