@echo off

set CURDIR=%cd%

WHERE npm
IF %ERRORLEVEL% NEQ 0 ( 
	ECHO npm wasn't found, install node [https://nodejs.org] in order to build the webapp
	EXIT -1
)

call :checkprerequisites tsc
call :checkprerequisites node-sass
call :buildwebapp
call :copybuildresults
call :copyprojectconfiguration

EXIT /B


:checkprerequisites
	echo Checking %~1 ...
	WHERE %~1
	IF %ERRORLEVEL% NEQ 0 (
		ECHO %~1 wasn't found, installing from npm globally
		npm install -g %~1
	) ELSE (
		ECHO %~1 found!
	)
	goto:EOF

:buildwebapp	
	cd ..\WebCommon
	echo Building web application ...
	call npm run build

	IF %ERRORLEVEL% NEQ 0 ( 
		ECHO Error building webapp, check messages to solve the packaging of webapp
		EXIT /B -1
	) ELSE (
		ECHO Web built correctly	
	)
	goto:EOF

:copybuildresults
	cd %CURDIR%
	set OUTDIR=%CURDIR%\content
	echo 
	if not exist "%OUTDIR%" (
		echo Creating %OUTDIR%
		mkdir "%OUTDIR%"
	) ELSE (
		echo %OUTDIR% yet exists	
	)

	echo "Deleting .js.map files in sources"
	del /S ..\WebCommon\app\*.js.map
	echo Copy app to %OUTDIR%
	robocopy "..\WebCommon\app" "%OUTDIR%\app" /xo /e /np /nfl /ndl /njh
	echo Copy data to %OUTDIR%
	robocopy "..\WebCommon\data" "%OUTDIR%\data" /xo /e /np /nfl /ndl /njh
	echo Copy libs to %OUTDIR%
	robocopy "..\WebCommon\libs" "%OUTDIR%\libs" /xo /e /np /nfl /ndl /njh
	echo Copy styles to %OUTDIR%
	robocopy "..\WebCommon\styles" "%OUTDIR%\styles" /xo /e /np /nfl /ndl /njh
	echo Copy node_modules to %OUTDIR%
	robocopy "..\WebCommon\node_modules-production" "%OUTDIR%\node_modules" /xo /e /np /nfl /ndl /njh
	echo Copy index.html to %OUTDIR%
	robocopy "..\WebCommon"  "%OUTDIR%" index.html  /xo /np /nfl /ndl /njh
	echo Copy systemjs.config.js to %OUTDIR%
	robocopy "..\WebCommon"  "%OUTDIR%" systemjs.config.js  /xo /np /nfl /ndl /njh

	goto:EOF

:copyprojectconfiguration
	set OUTDIR=%CURDIR%\content\data
	robocopy "%CURDIR%"  "%OUTDIR%" app-config.json /is /np /nfl /ndl /njh
	echo Copy app-model.json to %OUTDIR%
	robocopy "%CURDIR%"  "%OUTDIR%" app-model.json /is /np /nfl /ndl /njh
	echo Copy logo.svg to %OUTDIR%
	robocopy "%CURDIR%"  "%OUTDIR%" logo.svg /is /np /nfl /ndl /njh
	
	set OUTDIR=%CURDIR%\content\styles\images
	robocopy "%CURDIR%"  "%OUTDIR%" logo_white.png /is /np /nfl /ndl /njh
	goto:EOF


