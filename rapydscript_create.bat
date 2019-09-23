SET _path_full=%*
SET _path_noExtension=%_path_full:~0,-3%
call rapydscript %_path_noExtension%.py -o %_path_noExtension%__rps.temp -m -b -p -6
call tail +3 %_path_noExtension%__rps.temp > %_path_noExtension%__rps.js
call del %_path_noExtension%__rps.temp
call tsc %_path_noExtension%__rps.js --allowJs --outFile %_path_noExtension%.js  --target "es5"
call del %_path_noExtension%__rps.js
