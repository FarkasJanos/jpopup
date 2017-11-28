# JPopup

A lightweight jQuery popup plugin.

## Usage
- `$.JPopup({content: "Hello world!});`
- `<div data-jpopup data-jpopup-content="Hello world!">`

## Available options

- verbose: true or false. Add debug info about popup. Default: false
- hidden: true or false. This option will overridden in some situations eg delay. Default: false
- content: Expected. If no content specified, popup will not be displayed. Default: ''
- closeButton: Close button text or html content. Default `<i class="module-popup__close__button"></i>`
- closeButtonPosition: available: right top, left top, right bottom, left bottom. Default 'right top',
- textCenter: true or false. Content is centered or not. Default false
- maxWidth: true or false. Set popup to display stretched horizontally. Default false
- delay: ms, s. Time before popup displayed. Default null
- noiseTime: ms, s. Minimal timeout between any two popups displayed. Default 5000

## TODO

Add event listeners to check viewport reached or left

## Thanks

Mark Dalgleish html5data plugin
https://github.com/markdalgleish/jquery-html5data