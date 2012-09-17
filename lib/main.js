// TODO 進む戻るのグレイアウト、停止とリロードの切り換え
// TODO クリックしただけの場合は通常のメニューを出すオプションを加える。
// TODO 地域化
// TODO 拡張との通信
// TODO コマンドの実行
// TODO オプション

var data = require("self").data;
var pageMod = require("page-mod");
var windowUtils = require("window-utils");

function onRequestPageState(worker){
    return function(messageID) {
        var window = windowUtils.activeBrowserWindow;

        var stopCommand = window.XULBrowserWindow.stopCommand;
        var isLoading = stopCommand.getAttribute("disabled") != "true";

        var pageState = {
            isFirst: !window.getWebNavigation().canGoBack,
            isLast: !window.getWebNavigation().canGoForward,
            isLoading: isLoading
        };

        console.log(pageState.isFirst, pageState.isLast, pageState.isLoading);

        var message = {id: messageID, pageState: pageState};

        worker.port.emit("pageState", message);
    };
}

pageMod.PageMod({
    include: ['*'],
    contentScriptWhen: 'start',
    contentScriptFile: [
        data.url('vector2D.js'),
        data.url('menuItems.js'),
        data.url('detectContext.js'),
        data.url('menu.js')
    ],
    contentScriptOptions: {
        svgSource: data.load('menu.svg')
    },
    onAttach: function(worker) {
        worker.port.on("requestPageState", onRequestPageState(worker));
    }
});
