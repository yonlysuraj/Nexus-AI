"""
Test generation prompt templates for different frameworks.
"""

from typing import List

# ============================================================================
# PYTEST - Python testing framework
# ============================================================================

PYTEST_GENERATION_PROMPT = """
You are an expert Python test engineer. Your task is to write comprehensive pytest test cases for the given function.

**Function to test:**
```python
{code}
```

**Requirements:**
1. Cover the main functionality (happy path)
2. Test edge cases: {edge_cases_summary}
3. Test error conditions and exceptions
4. Use meaningful test names
5. Include assertions with clear messages
6. Use pytest fixtures if needed for setup/teardown

**Important:**
- Output ONLY valid, runnable pytest code
- Start with imports (import pytest, from module import function_name)
- Write tests in a class format when applicable
- Use descriptive test names like test_function_with_valid_input
- Include 3+ test methods
- Add docstrings explaining what each test verifies

**Output:**
```python
import pytest
# Import the function/module here

class Test{function_name}:
    def test_valid_case(self):
        # Test with valid inputs
        pass
    
    def test_edge_case_1(self):
        # Test with edge case
        pass
    
    def test_edge_case_2(self):
        # Test with another edge case
        pass
```

Generate the complete test code now:
"""

# ============================================================================
# JEST - JavaScript/TypeScript testing framework
# ============================================================================

JEST_GENERATION_PROMPT = """
You are an expert JavaScript test engineer. Your task is to write comprehensive Jest test cases for the given function.

**Function to test:**
```javascript
{code}
```

**Requirements:**
1. Cover the main functionality (happy path)
2. Test edge cases: {edge_cases_summary}
3. Test error conditions and exceptions
4. Use meaningful test names
5. Include assertions with clear messages
6. Use Jest matchers properly (expect().toBe(), expect().toThrow(), etc.)

**Important:**
- Output ONLY valid, runnable Jest code
- Start with imports/requires
- Use describe() for test suites
- Use test() or it() for individual tests
- Write descriptive test names
- Include 3+ test cases
- Add comments explaining what each test verifies
- Use proper Jest matchers

**Output:**
```javascript
describe('{function_name}', () => {{
  test('should handle valid input', () => {{
    // Test with valid inputs
  }});
  
  test('should handle edge case', () => {{
    // Test with edge case
  }});
  
  test('should throw error for invalid input', () => {{
    // Test error handling
  }});
}});
```

Generate the complete test code now:
"""

# ============================================================================
# JUNIT - Java testing framework
# ============================================================================

JUNIT5_GENERATION_PROMPT = """
You are an expert Java test engineer. Your task is to write comprehensive JUnit 5 test cases for the given method.

**Method to test:**
```java
{code}
```

**Requirements:**
1. Cover the main functionality (happy path)
2. Test edge cases: {edge_cases_summary}
3. Test error conditions and exceptions
4. Use meaningful test names with @DisplayName
5. Include assertions with clear messages
6. Use parametrized tests for multiple scenarios if applicable

**Important:**
- Output ONLY valid, runnable JUnit 5 code
- Start with necessary imports (org.junit.jupiter.api.*)
- Use @Test annotation for test methods
- Use @DisplayName for readable test descriptions
- Write descriptive method names (testMethodNameWithScenario)
- Include 3+ test methods
- Use appropriate assertions (assertEquals, assertTrue, assertThrows, etc.)
- Add clear comments explaining test intent

**Output:**
```java
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

@DisplayName("{function_name} Tests")
class {ClassName}Test {{
    
    @Test
    @DisplayName("should handle valid input")
    void testValidInput() {{
        // Test with valid inputs
    }}
    
    @Test
    @DisplayName("should handle edge case")
    void testEdgeCase() {{
        // Test with edge case
    }}
    
    @Test
    @DisplayName("should throw exception for invalid input")
    void testInvalidInput() {{
        // Test error handling
    }}
}}
```

Generate the complete test code now:
"""

JUNIT4_GENERATION_PROMPT = """
You are an expert Java test engineer. Your task is to write comprehensive JUnit 4 test cases for the given method.

**Method to test:**
```java
{code}
```

**Requirements:**
1. Cover the main functionality (happy path)
2. Test edge cases: {edge_cases_summary}
3. Test error conditions and exceptions
4. Use meaningful test names
5. Include assertions with clear messages
6. Use @Before/@After for setup/teardown if needed

**Important:**
- Output ONLY valid, runnable JUnit 4 code
- Start with necessary imports (org.junit.*)
- Use @Test annotation for test methods
- Write descriptive method names (testMethodNameWithScenario)
- Include 3+ test methods
- Use appropriate assertions (assertEquals, assertTrue, fail, etc.)
- Add clear comments explaining test intent

**Output:**
```java
import org.junit.Test;
import static org.junit.Assert.*;

public class {ClassName}Test {{
    
    @Test
    public void testValidInput() {{
        // Test with valid inputs
    }}
    
    @Test
    public void testEdgeCase() {{
        // Test with edge case
    }}
    
    @Test(expected = Exception.class)
    public void testInvalidInput() {{
        // Test error handling
    }}
}}
```

Generate the complete test code now:
"""

# ============================================================================
# VITEST - Modern TypeScript testing framework
# ============================================================================

VITEST_GENERATION_PROMPT = """
You are an expert TypeScript test engineer. Your task is to write comprehensive Vitest test cases for the given function.

**Function to test:**
```typescript
{code}
```

**Requirements:**
1. Cover the main functionality (happy path)
2. Test edge cases: {edge_cases_summary}
3. Test error conditions and exceptions
4. Use meaningful test names
5. Include assertions with clear messages
6. Use Vitest matchers properly

**Important:**
- Output ONLY valid, runnable Vitest code
- Start with imports from 'vitest'
- Use describe() for test suites
- Use test() or it() for individual tests
- Write descriptive test names
- Include 3+ test cases
- Add comments explaining what each test verifies
- Use proper Vitest matchers

**Output:**
```typescript
import {{ describe, it, expect }} from 'vitest';
import {{ functionName }} from './module';

describe('{function_name}', () => {{
  it('should handle valid input', () => {{
    // Test with valid inputs
  }});
  
  it('should handle edge case', () => {{
    // Test with edge case
  }});
  
  it('should throw error for invalid input', () => {{
    // Test error handling
  }});
}});
```

Generate the complete test code now:
"""

# ============================================================================
# Helper functions
# ============================================================================


def get_test_generation_prompt(
    framework: str,
    code: str,
    edge_cases_summary: str,
    function_name: str = "Function",
) -> str:
    """
    Get the appropriate test generation prompt for a framework.

    Args:
        framework: Test framework (pytest, jest, vitest, mocha, junit4, junit5)
        code: Source code snippet
        edge_cases_summary: Summary of edge cases to cover
        function_name: Name of the function being tested

    Returns:
        Formatted prompt string ready to send to LLM
    """
    framework = framework.lower().strip()

    if framework == "pytest":
        return PYTEST_GENERATION_PROMPT.format(
            code=code,
            edge_cases_summary=edge_cases_summary,
            function_name=function_name,
        )

    elif framework in ["jest", "mocha"]:
        return JEST_GENERATION_PROMPT.format(
            code=code,
            edge_cases_summary=edge_cases_summary,
            function_name=function_name,
        )

    elif framework == "vitest":
        return VITEST_GENERATION_PROMPT.format(
            code=code,
            edge_cases_summary=edge_cases_summary,
            function_name=function_name,
        )

    elif framework == "junit5":
        return JUNIT5_GENERATION_PROMPT.format(
            code=code,
            edge_cases_summary=edge_cases_summary,
            ClassName=f"{function_name}Test",
            function_name=function_name,
        )

    elif framework == "junit4":
        return JUNIT4_GENERATION_PROMPT.format(
            code=code,
            edge_cases_summary=edge_cases_summary,
            ClassName=f"{function_name}Test",
            function_name=function_name,
        )

    else:
        # Default to pytest-like format
        return PYTEST_GENERATION_PROMPT.format(
            code=code,
            edge_cases_summary=edge_cases_summary,
            function_name=function_name,
        )


def get_framework_by_language(language: str) -> List[str]:
    """Get supported test frameworks for a language."""
    language = language.lower().strip()

    frameworks_map = {
        "python": ["pytest", "unittest"],
        "javascript": ["jest", "vitest", "mocha"],
        "typescript": ["jest", "vitest"],
        "java": ["junit4", "junit5"],
    }

    return frameworks_map.get(language, ["pytest"])


# Type hint for return type of get_framework_by_language
from typing import List
