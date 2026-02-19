# Oracle Kiro CLI Fix

## Problem
The Oracle AI module was failing with the error:
```
hypervisia - ERROR - Kiro CLI error: timeout: failed to run command 'kiro-cli': No such file or directory
```

## Root Causes
1. **PATH Issue**: The subprocess created by `asyncio.create_subprocess_shell` didn't inherit the full PATH environment variable, so it couldn't find `kiro-cli` which is installed in `/home/ubuntu/.local/bin/`

2. **Incorrect CLI Arguments**: The code was using `--temperature` and `--max-tokens` arguments which don't exist in kiro-cli. The correct command is `kiro-cli chat --no-interactive`

## Solution Applied

### File Modified: `app/oracle/ai_providers.py`

#### Changes Made:
1. **Added environment variable setup** to ensure PATH includes kiro-cli location:
   ```python
   import os
   env = os.environ.copy()
   env['PATH'] = f"/home/ubuntu/.local/bin:{env.get('PATH', '')}"
   ```

2. **Updated subprocess call** to pass the environment:
   ```python
   process = await asyncio.create_subprocess_shell(
       f'kiro-cli chat --no-interactive "{prompt}"',
       stdout=asyncio.subprocess.PIPE,
       stderr=asyncio.subprocess.PIPE,
       env=env  # Added this parameter
   )
   ```

3. **Fixed command syntax** from:
   ```bash
   echo "{prompt}" | timeout 30 kiro-cli --temperature {temperature} --max-tokens {max_tokens}
   ```
   to:
   ```bash
   kiro-cli chat --no-interactive "{prompt}"
   ```

4. **Increased timeout** from 35 seconds to 60 seconds for better reliability

5. **Enhanced error detection** to include "No such file or directory" in the error message check

## Testing
Tested successfully with a simple query "Quelle est la capitale de la France?" which returned the correct answer in 4.35 seconds.

## Impact
- Oracle AI with Kiro provider now works correctly
- No changes needed to other AI providers (Shai, OpenAI)
- No database or API changes required
- Backward compatible with existing code

## Notes
- The kiro-cli doesn't support temperature or max_tokens parameters, so these are ignored when using the Kiro provider
- If you need fine-grained control over these parameters, use the Shai or OpenAI providers instead
