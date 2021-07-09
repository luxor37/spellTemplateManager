v2.1.3 **7/9/2021
* Corrected manifest

v2.1.2 **7/8/2021
* Corrected compatibility with About Time module
* Corrected bug causing an error if a locked compendium item was opened.

v2.1.0
* Added ability to reuse item templates.

v2.0.5
* Corrected issue with "Ignore Duration" flag being ignored.

v2.0.4
* Corrected casing that was preventing module load on non-Windows platforms. 

v2.0.3
* squashed bugs.

v2.0.2
* bad release resolved with v2.0.3.

v2.0.1
* Corrected bug in libwrapper implementation that was  preventing loading on all systems.

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
