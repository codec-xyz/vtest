import { screen as electronScreen, Notification } from "electron";

export function initDisplayData() {

    let displays: { label: string; workArea: Electron.Rectangle; }[] = electronScreen.getAllDisplays().map(({ label, workArea }) => ({ label, workArea }));
    let primaryDisplay = displays.find(display => display.workArea.x < 100 && display.workArea.y < 100); // Top corner is (0, 0) less menus etc.
    let sortedDisplays: { label: string; workArea: Electron.Rectangle; }[] = displays.sort((a, b) => a.workArea.x - b.workArea.x);

    if (sortedDisplays.length === 1) {
        return { Primary: primaryDisplay };
    } else {
        // test if all 'y' values are 0, this means the displays are in a row, else stacked or grid.
        let isDisplayRow = true;
        for (let i = 1; i < sortedDisplays.length; i++) {
            if (sortedDisplays[i].workArea.y !== 0) {
                isDisplayRow = false;
                break;
            }
        }

        if (isDisplayRow) {
            switch (sortedDisplays.length) {
                case 2:
                    return { Left: sortedDisplays[0], Right: sortedDisplays[1] };
                case 3:
                    return { Left: sortedDisplays[0], Center: sortedDisplays[1], Right: sortedDisplays[2] };
                case 4:
                    return { FarLeft: sortedDisplays[0], Left: sortedDisplays[1], Right: sortedDisplays[2], FarRight: sortedDisplays[3] };
                default:
                    // For more than 4 displays, use numeric naming
                    return sortedDisplays.reduce((acc, display, index) => {
                        acc[`Display${index + 1}`] = display;
                        return acc;
                    }, {} as Record<string, typeof sortedDisplays[0]>);
            }
        } else {
            // TODO: Add support for stacked and grid displays
            // I don't have a stacked or grid display to test with, so this is untested.
            console.warn('LINE 37 - displayData.ts - Stacked and grid displays are not supported yet. Using primary display.');
            console.log('Checking if notifications are supported in displayData:', Notification.isSupported());
            const NOTIFICATION_TITLE = 'Basic Notification'
            const NOTIFICATION_BODY = 'Notification from the Main process'

            if (Notification.isSupported()) {
                console.log('Attempting to show notification from displayData...');
                const notification = new Notification({
                    title: NOTIFICATION_TITLE,
                    body: NOTIFICATION_BODY
                });
                notification.show();
                console.log('Notification shown from displayData');
            } else {
                console.log('Notifications are not supported (in displayData)');
            }
            return { Primary: primaryDisplay }
        }
    }
}