v2.0.0
* Template texture settings are now stored on the actor rather than the item
* Added ability to apply textures to consubable objects such as wands and scrolls
* Added additional About-Time compatibility. 
* Squashed bugs
* Major code overhaul to separate code into logical chunks
* Added unique texturing to each template to allow for non-syncronous animation.  This also corrects an issue where if two templates were using the same texture and one had stopped animating, redrawing one such template would cause all to reanimate.

v1.2.2
* Increased compatibility with some browsers

v1.2.1 **6/22/2021
* Fixed bugs

v1.2.0 **6/22/2021
* fixed bugs in applyTexture code
* Added option to loop animations

v.1.1.0 **6/22/2021
* added field to template configuration to allow for non-managed templates to timeout 
* Removed top/bottom lines from tooltip
* added options for cone templates to adjust origin of texture files.

v1.0.0  ##06/21/2021
* Corrected bugs that were generating error messages in the console.
* Added initial support for PF2E system
* Added Measured Template tooltips
* Improved About-Time support to allow for automatic generation of About-Time expiration for existing templates, when switching to About-Time processing.
