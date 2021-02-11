**Note:** This project is WIP.

mufonts
=======

A collection of fonts compatible with Adafruit GFX library. These fonts were developed when
creating various samples for mupplet display code.

List of available Fonts
-----------------------

The following fonts are included in this library:

| Font Name                 | yAdvance  | Baseline  | Description
|---------------------------|-----------|-----------|--------------------------------------------------------
| `muMatrix8ptRegular`      | 8px       | 7px       | Proprotional font optimized for one line led displays like 8x8 mudules driven by max7219 or similar
| `muHeavy8ptBold`          | 8px       | 7px       | Semiproportional ultra heavy font for one line led displays like 8x8 mudules driven by max7219 or similar


Using Fonts with a muwerk mupplet
---------------------------------

Add the mufonts library to your `platformio.ini` or drop it in your arduino libraries directory,
include font in your project and add it to the mupplet during mupplet initialization:

```c++
#include "display_matrix_max72xx.h"
#include "muMatrix8ptRegular.h"

ustd::DisplayMatrixMAX72XX matrix("matrix", D8, 8, 1, 1);

...
    matrix.begin(&sched);
    matrix.addfont(&muMatrix8ptRegular);

...
    sched.publish( "matrix/display/font/set" "1");
    sched.publish( "matrix/display/print" "Test 123");

```



Using Fonts with Adafruit GFX library
-------------------------------------

Take a copy of the mufont library and drop it in your arduino libraries directory, include
font in your project (path will find things in libraries directory) and use the font by
name in place of the system font:

```c++
#include "muMatrix8ptRegular.h"

...

  display.setFont(&muMatrix8ptRegular);  // choose font
  display.setTextSize(1);
  display.setTextColor(1);
  display.setTextWrap(false);
  display.setCursor(0,7);   // as per Adafruit convention custom fonts draw up from baseline so move cursor
  display.println("Test 123");

  display.setFont() // return to the system font
```

