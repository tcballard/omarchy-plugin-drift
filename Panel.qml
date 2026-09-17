import QtQuick
import "lib/qml"
StackPanel {
 title: "Drift"
 hints: "Enter stage key reset · R stage file reset · p pin · e edit · u raw diff · / search · Esc close"
 onAction: (id,key) => { key = ({"R":"reset-file","p":"pin","u":"raw"})[key] || key
 if (service) service.act(id,key) }
}
