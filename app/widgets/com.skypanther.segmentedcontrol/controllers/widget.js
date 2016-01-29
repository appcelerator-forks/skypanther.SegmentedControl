var args = arguments[0] || {},
	enabled = true;

// custom properties that can/should be set in the TSS of the view where you're putting the tabbed bar
var selectedButtonColor = args.selectedButtonColor || "#d9bc1b",
	unselectedButtonColor = args.unselectedButtonColor || "#226e92", 
	selectedButtonTextColor = args.selectedButtonTextColor || "#fff",
	unselectedButtonTextColor = args.unselectedButtonTextColor || "#000",
	disabledTextColor = args.disabledTextColor || '#aaa',
	disabledButtonBackgroundColor = args.disabledButtonBackgroundColor || '#444'
	borderColor = args.borderColor || 'transparent',
	font = args.font || (OS_IOS ? {fontFamily: 'Avenir-Light', fontSize: 11} : {fontWeight: 'normal', fontSize: '15dp'});

args.borderColor = borderColor; // stuff this back in there in case it's not set in the tss

$.segCtrlWrapper.applyProperties(_.omit(args, 'id', '__parentSymbol', '__itemTemplate', '$model', 'selectedButtonColor', 'unselectedButtonColor', 'selectedButtonTextColor', 'unselectedButtonTextColor', 'font'));

var height = ((isNaN(parseInt($.segCtrlWrapper.height))) ? 40 : parseInt($.segCtrlWrapper.height)) - 2;
if (OS_ANDROID) height += 'dp';
var callback = function () {}; // empty function as placeholder

var buttons = [];
exports.init = function (labels, cb) {
	var wrapperWidthIsCalculated = false;
	if (typeof cb == 'function') callback = cb;
	if (!labels || !_.isArray(labels) || labels.length === 0) {
		labels = ['Yes', 'No'];
	}
	// calculate button width
	if (OS_ANDROID) {
		if (isNaN(parseInt($.segCtrlWrapper.width))) {
			$.segCtrlWrapper.width = Ti.Platform.displayCaps.platformWidth / Ti.Platform.displayCaps.logicalDensityFactor;
			wrapperWidthIsCalculated = true;
		}
	} else if (OS_IOS) {
		if (isNaN(parseInt($.segCtrlWrapper.width))) {
			// iOS handles rotation, but the wrapper width needs to be calculated to be
			// the smaller of the height or width to avoid layout issues
			if (Ti.Platform.displayCaps.platformWidth < Ti.Platform.displayCaps.platformHeight) {
				$.segCtrlWrapper.width = Ti.Platform.displayCaps.platformWidth;
			} else {
				$.segCtrlWrapper.width = Ti.Platform.displayCaps.platformHeight;
			}
		}
	}

	var btnWidth = parseInt($.segCtrlWrapper.width) / labels.length;
	if (OS_ANDROID) btnWidth += 'dp';

	// make our buttons
	for (var i = 0, j = labels.length; i < j; i++) {
		if (OS_ANDROID && !wrapperWidthIsCalculated && i === j-1) {
			// if an explicit width has been set, we need to shrink the last button
			// by 1 or it will be too wide for the container and won't be shown
			btnWidth = (parseInt(btnWidth) - 1) + 'dp';
		}
		var btn = Widget.createController('button', {
			text: labels[i],
			width: btnWidth,
			height: Ti.UI.FILL,
			left: 0,
			top: 0,
			bottom: 0,
			color: unselectedButtonTextColor,
			backgroundColor: unselectedButtonColor,
			font: font
		}).getView();
		if (args.index == i) {
			_highlight(btn);
		}
		buttons.push(btn);
		$.segCtrlWrapper.add(btn);
	}

	// event listener on the wrapper determines button clicked by x coord of click location
	$.segCtrlWrapper.addEventListener('click', function (e) {
		var clickedButton,
			butWid;
		var point = e.source.convertPointToView({
			x: e.x,
			y: e.y
		}, $.segCtrlWrapper);
		if (OS_ANDROID) {
			butWid = parseFloat(btnWidth.replace('dp', '')) * Ti.Platform.displayCaps.logicalDensityFactor;
			clickedButton = Math.floor(point.x / butWid);
		} else {
			butWid = btnWidth;
			clickedButton = Math.floor(point.x / butWid);
		}
		if (buttons[clickedButton].disabled) {
			return;
		}
		_.each(buttons, function (element, index, list) {
			if (enabled) {
				if (index == clickedButton) {
					_highlight(element);
				} else {
					_unhighlight(element);
				}
			}
		});
		callback(clickedButton);
	});
};

function _highlight(btn) {
	if (btn) {
		btn.backgroundColor = selectedButtonColor;
		btn.color = selectedButtonTextColor;
	}
}

function _unhighlight(btn) {
	if (!btn.disabled) {
		btn.backgroundColor = unselectedButtonColor;
		btn.color = unselectedButtonTextColor;
	}
}

exports.select = function (num) {
	var btnNumber = parseInt(num) || 0;
	_highlight(buttons[btnNumber]);
};
exports.deselect = function (num) {
	var btnNumber = parseInt(num) || 0;
	_unhighlight(buttons[btnNumber]);
};
exports.enable = function () {
	enabled = true;
};
exports.disable = function () {
	enabled = false;
};
exports.deselectAll = function () {
	_.each(buttons, _unhighlight);
};

exports.changeButtonLabels = function (arr) {
	if (!arr || !arr.length || arr.length != buttons.length) {
		throw "You must pass an array with " + buttons.length + " members to this function";
	}
	for (var b = 0, c = buttons.length; b < c; b++) {
		buttons[b].text = arr[b];
	}
};


/*
Public function to disable a button (make it non-clickable)
*/
exports.disableButton = function (num) {
	if (typeof num !== 'number' || !buttons[num]) {
		return;
	}
	// turn it semi-transparent
	// disable the click handler
	_unhighlight(buttons[num]);
	buttons[num].opacity = 0.4;
	buttons[num].color = disabledTextColor;
	buttons[num].backgroundColor = disabledButtonBackgroundColor;
	buttons[num].disabled = true;
};
exports.disableAllButtons = function () {
	for (var i = 0, j = buttons.length; i < j; i++) {
		exports.disableButton(i);
	}
};
/*
Public function to enable a button (make it clickable)
*/
exports.enableButton = function (num) {
	// turn it fully opaque
	// enable the click handler
	if (typeof num !== 'number' || !buttons[num]) {
		return;
	}
	_unhighlight(buttons[num]);
	buttons[num].opacity = 1;
	buttons[num].color = unselectedButtonTextColor;
	buttons[num].disabled = false;
};
exports.enableAllButtons = function () {
	for (var i = 0, j = buttons.length; i < j; i++) {
		exports.enableButton(i);
	}
};