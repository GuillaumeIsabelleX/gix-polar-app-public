export namespace Tabs {

    export function activeTab(): Promise<chrome.tabs.Tab> {

        return new Promise<chrome.tabs.Tab>(((resolve, reject) => {

            chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, (tabs) => {

                if (tabs.length === 0) {
                    reject(new Error("No active tab"));
                }

                if (tabs.length > 1) {
                    reject(new Error("Too many active tabs"));
                }

                resolve(tabs[0])

            });

        }));

    }

    export function loadLinkInNewTab(link: string) {
        chrome.tabs.create({url: link});
    }

    export function queryCurrentTabForLink() {

        return new Promise<string>(resolve => {

            chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, (tabs) => {
                const link = tabs[0].url;
                resolve(link);
            });

        });

    }

}
