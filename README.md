# spellTemplateManager
Spell Template Management Module for Foundry VTT

Spell Template Manager is a module developed in JavaScript to extend the capabilities of the DnD5E system of Foundry VTT. After enabling the module, Spell Template Manager (STM) will take over multiple aspects of managing measured templates as they are deployed to a scene.  Whenever a template is generated through the AbilityUseDialog of the DnD5E system, the ability/item/spell will be analyzed to determine the ability's duration and requirements for concentration.  Based on this analysis, the template will be flagged with meta-data indicating this information along with other relevant information that allows the system to function.  The border of the newly created templates are color-coded to indicate the status of the template. STM then tracks the meta-data as turns progress through the combat tracker.  As templates reach expiration, STM automatically removes them from the scene.  If a second spell requiring concentration is cast, any previous concentration spells for that actor will be removed immediately.  Additionally, at the conclusion of a player's turn, they will be given the opportunity to impose management on any existing unmanaged templates that they own, giving them the option to skip, delete, or claim (begin management of) the unmanaged template.

In all, there are 5 status of templates: unmanaged, instantaneous, concentration, enduring, and special.  
Unmanaged templates are any template that was created outside of the AbilityUseDialog.  In the DnD5E system, this is assumed to be manually created templates that were generated using the "Measured Templates" control.  They will utilize the default border color.

Instantaneous templates are templates that have an "instantaneous" duration, and therefore do not require concentration.  By default these templates will utilize a black border.

Concentration templates are templates that have a duration greater than instantaneous, but which require concentration to maintain.  By default these templates will utilize a yellow border.

Enduring templates are templates that have a duration greater than instantaneous, but do not require concentration to maintain.  By default these templates will utilize a green border.

Special templates are templates that have a non-time-based duration, typically this involves a trigger of some sort.  These templates do not require concentration to maintain.  By default these templates will utilize a white border.  Note: these templates will not be automatically removed by STM, they will require manual deletion.  

The color's utilized by the 4 managed template types are all configurable via 24-bit Hexadecimal color codes (RRGGBB) in the module settings dialogue.  
