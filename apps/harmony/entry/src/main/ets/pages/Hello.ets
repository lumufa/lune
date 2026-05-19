@Entry
@Component
struct Hello {
  @State private counter: number = 0;

  build() {
    Column() {
      Text('Hello Harmony')
        .fontSize(28)
        .fontColor('#FF4D6A')
        .margin({ top: 80, bottom: 24 })

      Text(`Counter: ${this.counter}`)
        .fontSize(20)
        .margin({ bottom: 24 })

      Button('Tap me')
        .onClick(() => { this.counter += 1; })
    }
    .width('100%')
    .height('100%')
    .alignItems(HorizontalAlign.Center)
    .backgroundColor('#FBF8F9')
  }
}
