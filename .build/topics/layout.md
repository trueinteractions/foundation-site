# Positioning Controls in Tint #

Tint uses an auto-layout system for setting the size and position of objects on a page. Any {@link Control} can utilize auto-layout to position itself. 

### Layout Properties ###

1. {@link Control.width}
2. {@link Control.height}
3. {@link Control.left}
4. {@link Control.right}
5. {@link Control.bottom}
6. {@link Control.top}
7. {@link Control.middle}
8. {@link Control.center}

All layout properties can take one of the following values:

1. A percentage value expressed as a string with '%' appended to it.
2. A logical pixel value expressed as a number or a string with 'px' appended to it.
3. A control to align the value of the setting control to.

Layout properites for one control do not have to have the same type of values, a left value can have a percentage, while the right value may be bound to a different value type, such as a pixel.

### Using Percentages for Layout ###

When any layout property is set to a percentage the system calculates the percentage of the property from its parents property and complement.  For example, if ```control.left = '50%'```, the left value of control is set to 50% to the left of the parents control (or, 50% of the parents width, starting from the left.)  Similarly, ```control.right = '30%'``` calculates the position of the right value of the control as 30% of the parents width, starting from the right. 

Percentages can be applied to all property values. Including width and height and are always based on the parent control or container. 

Use percentage values when the space needed is relative to the parents container width or height and does not necessarily need to be fixed. 

### Using Pixels for Layout ###

Pixels (logical) allow you to relativily position the control from its parent position by a pixel unit. If both the right and left values are set the width is automatically inferred.  Note that if you have the left/right values set the width cannot be set.  Likewise, if the top/bottom values are set the height cannot be set (as its inferred).  

Fixing the layout via pixels can be thought of "pinning" the controls at a specific spot (or mandating the width/height as a fixed value).  While setting the width and height fixes the size, setting the left and right does not fix the width and height (just the position of the left and the right values of the control).  This leads to powerful capabilities in layout such as using relative widths but pinning the right of a control for a fixed right margin but allowing the control to take up a percentage of the width of the parent. 

### Using Controls as Values for Layout ###

In some circumstances its useful to bind a layout property to another control.  Say we want a control to have the same left value (or be aligned left) to the control above it, or perhaps we want to "stack" controls on top of one another. Assigning a control as the value to a layout property binds its complement to its value. 

For example; if you need to set two buttons next to each other button1, and button2, button2's left property can be set to button1 (e.g., ```button2.left=button1```).  This assigns button2's left value to always be equal to button1's 'left's' complement (or right).  In other words, button2's left value will always be equal to button1's right value.  This works similar for assigning the top of a control to another control (it's bound to its bottom).

Binding to controls as values is useful when you need to quickly arrange a grid of elements without having to rely on tables or grid based systems. It also prevents having to nest elements and leads to greater rendering gains.