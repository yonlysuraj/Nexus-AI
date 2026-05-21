"""
Edge case identifier - Suggest test values based on parameter types.
"""

from enum import Enum
from typing import List
from dataclasses import dataclass
from loguru import logger

from app.services.code_parser import CodeFunction


class EdgeCaseCategory(str, Enum):
    """Types of edge cases."""
    NULL = "null"
    EMPTY = "empty"
    BOUNDARY = "boundary"
    NEGATIVE = "negative"
    TYPE_MISMATCH = "type_mismatch"
    EXCEPTION = "exception"
    LARGE_VALUE = "large_value"
    WHITESPACE = "whitespace"
    PRECISION = "precision"


@dataclass
class EdgeCase:
    """Represents a suggested edge case for testing."""
    category: EdgeCaseCategory
    description: str
    test_value: str
    python_value: str
    javascript_value: str
    java_value: str


class EdgeCaseIdentifier:
    """Identify and suggest edge cases for code functions."""

    # Type patterns for common frameworks
    TYPE_PATTERNS = {
        "number": ["int", "float", "double", "long", "Integer", "Double"],
        "string": ["str", "string", "String", "char"],
        "collection": ["list", "array", "List", "Array", "Set", "Collection"],
        "dict": ["dict", "object", "Map", "Object", "{}"],
        "boolean": ["bool", "boolean", "Boolean"],
        "null": ["None", "null", "undefined", "Optional"],
    }

    @staticmethod
    def identify_edge_cases(func: CodeFunction) -> List[EdgeCase]:
        """
        Identify edge cases for a function based on its parameters.

        Args:
            func: CodeFunction object with parameter info

        Returns:
            List of EdgeCase suggestions
        """
        edge_cases = []

        for param in func.params:
            param_type = param.get("type", "Any").lower().strip()
            param_name = param.get("name", "param")

            # Identify parameter type category
            type_category = EdgeCaseIdentifier._categorize_type(param_type)

            # Generate edge cases based on category
            if type_category == "number":
                edge_cases.extend(EdgeCaseIdentifier._edge_cases_for_number(param_name))
            elif type_category == "string":
                edge_cases.extend(EdgeCaseIdentifier._edge_cases_for_string(param_name))
            elif type_category == "collection":
                edge_cases.extend(EdgeCaseIdentifier._edge_cases_for_collection(param_name))
            elif type_category == "dict":
                edge_cases.extend(EdgeCaseIdentifier._edge_cases_for_dict(param_name))
            elif type_category == "boolean":
                edge_cases.extend(EdgeCaseIdentifier._edge_cases_for_boolean(param_name))
            else:
                # Generic edge case for unknown types
                edge_cases.append(
                    EdgeCase(
                        category=EdgeCaseCategory.NULL,
                        description=f"{param_name} is None/null/undefined",
                        test_value="None",
                        python_value="None",
                        javascript_value="null",
                        java_value="null",
                    )
                )

        return edge_cases

    @staticmethod
    def _categorize_type(type_str: str) -> str:
        """Categorize a type string."""
        for category, patterns in EdgeCaseIdentifier.TYPE_PATTERNS.items():
            if any(pattern in type_str for pattern in patterns):
                return category
        return "other"

    @staticmethod
    def _edge_cases_for_number(param_name: str) -> List[EdgeCase]:
        """Generate edge cases for numeric parameters."""
        return [
            EdgeCase(
                category=EdgeCaseCategory.BOUNDARY,
                description=f"{param_name} is 0",
                test_value="0",
                python_value="0",
                javascript_value="0",
                java_value="0",
            ),
            EdgeCase(
                category=EdgeCaseCategory.NEGATIVE,
                description=f"{param_name} is -1",
                test_value="-1",
                python_value="-1",
                javascript_value="-1",
                java_value="-1",
            ),
            EdgeCase(
                category=EdgeCaseCategory.BOUNDARY,
                description=f"{param_name} is 1",
                test_value="1",
                python_value="1",
                javascript_value="1",
                java_value="1",
            ),
            EdgeCase(
                category=EdgeCaseCategory.LARGE_VALUE,
                description=f"{param_name} is very large (999999)",
                test_value="999999",
                python_value="999999",
                javascript_value="999999",
                java_value="999999",
            ),
            EdgeCase(
                category=EdgeCaseCategory.PRECISION,
                description=f"{param_name} is float (3.14)",
                test_value="3.14",
                python_value="3.14",
                javascript_value="3.14",
                java_value="3.14",
            ),
        ]

    @staticmethod
    def _edge_cases_for_string(param_name: str) -> List[EdgeCase]:
        """Generate edge cases for string parameters."""
        return [
            EdgeCase(
                category=EdgeCaseCategory.EMPTY,
                description=f'{param_name} is empty string ""',
                test_value='""',
                python_value='""',
                javascript_value='""',
                java_value='""',
            ),
            EdgeCase(
                category=EdgeCaseCategory.WHITESPACE,
                description=f'{param_name} is whitespace "   "',
                test_value='" " or "   "',
                python_value='" " * 3',
                javascript_value='"   "',
                java_value='" " + " " + " "',
            ),
            EdgeCase(
                category=EdgeCaseCategory.NULL,
                description=f"{param_name} is None/null/undefined",
                test_value="None/null",
                python_value="None",
                javascript_value="null",
                java_value="null",
            ),
            EdgeCase(
                category=EdgeCaseCategory.LARGE_VALUE,
                description=f"{param_name} is very long string (1000+ chars)",
                test_value='"a" * 1000',
                python_value='"a" * 1000',
                javascript_value='"a".repeat(1000)',
                java_value='String.valueOf("a").repeat(1000)',
            ),
        ]

    @staticmethod
    def _edge_cases_for_collection(param_name: str) -> List[EdgeCase]:
        """Generate edge cases for collection parameters."""
        return [
            EdgeCase(
                category=EdgeCaseCategory.EMPTY,
                description=f"{param_name} is empty list/array",
                test_value="[]",
                python_value="[]",
                javascript_value="[]",
                java_value="new ArrayList<>()",
            ),
            EdgeCase(
                category=EdgeCaseCategory.BOUNDARY,
                description=f"{param_name} has one element",
                test_value="[1]",
                python_value="[1]",
                javascript_value="[1]",
                java_value="List.of(1)",
            ),
            EdgeCase(
                category=EdgeCaseCategory.LARGE_VALUE,
                description=f"{param_name} has many elements (1000+)",
                test_value="range(1000) or [i for i in range(1000)]",
                python_value="list(range(1000))",
                javascript_value="Array.from({length: 1000}, (_, i) => i)",
                java_value='IntStream.range(0, 1000).boxed().collect(Collectors.toList())',
            ),
            EdgeCase(
                category=EdgeCaseCategory.NULL,
                description=f"{param_name} contains None/null elements",
                test_value="[None, 1, 2]",
                python_value="[None, 1, 2]",
                javascript_value="[null, 1, 2]",
                java_value="List.of(null, 1, 2)",
            ),
        ]

    @staticmethod
    def _edge_cases_for_dict(param_name: str) -> List[EdgeCase]:
        """Generate edge cases for dict/object parameters."""
        return [
            EdgeCase(
                category=EdgeCaseCategory.EMPTY,
                description=f"{param_name} is empty dict/object",
                test_value="{{}} or {{}}",
                python_value="{}",
                javascript_value="{}",
                java_value="new HashMap<>()",
            ),
            EdgeCase(
                category=EdgeCaseCategory.BOUNDARY,
                description=f"{param_name} has one key",
                test_value='{"a": 1}',
                python_value='{"a": 1}',
                javascript_value='{"a": 1}',
                java_value='Map.of("a", 1)',
            ),
            EdgeCase(
                category=EdgeCaseCategory.NULL,
                description=f"{param_name} has None/null values",
                test_value='{"key": None}',
                python_value='{"key": None}',
                javascript_value='{"key": null}',
                java_value='Map.of("key", null)',
            ),
        ]

    @staticmethod
    def _edge_cases_for_boolean(param_name: str) -> List[EdgeCase]:
        """Generate edge cases for boolean parameters."""
        return [
            EdgeCase(
                category=EdgeCaseCategory.BOUNDARY,
                description=f"{param_name} is True",
                test_value="True",
                python_value="True",
                javascript_value="true",
                java_value="true",
            ),
            EdgeCase(
                category=EdgeCaseCategory.BOUNDARY,
                description=f"{param_name} is False",
                test_value="False",
                python_value="False",
                javascript_value="false",
                java_value="false",
            ),
        ]

    @staticmethod
    def get_suggested_test_values(param_type: str) -> List[str]:
        """
        Get suggested test values for a parameter type.

        Args:
            param_type: Type string (e.g., "int", "string", "list")

        Returns:
            List of suggested test values
        """
        type_category = EdgeCaseIdentifier._categorize_type(param_type.lower())

        if type_category == "number":
            return ["0", "-1", "1", "999999", "3.14"]
        elif type_category == "string":
            return ['""', '" "', "None", '"a" * 1000']
        elif type_category == "collection":
            return ["[]", "[1]", "list(range(1000))", "[None, 1, 2]"]
        elif type_category == "dict":
            return ["{}", '{"a": 1}', '{"key": None}']
        elif type_category == "boolean":
            return ["True", "False"]
        else:
            return ["None", '""', "0", "[]"]
