"""
Code parser service - Extract functions and classes from code snippets.

Supports: Python, JavaScript, TypeScript, Java
"""

import ast
import re
from typing import List, Optional, Dict
from dataclasses import dataclass
from loguru import logger


@dataclass
class CodeFunction:
    """Represents a parsed function or method."""
    name: str
    params: List[Dict[str, str]]  # [{"name": "x", "type": "int", "default": None}, ...]
    return_type: Optional[str]
    description: str
    source_code: str
    language: str


@dataclass
class CodeClass:
    """Represents a parsed class."""
    name: str
    methods: List[CodeFunction]
    description: str
    source_code: str
    language: str


class CodeParser:
    """Parse code in multiple languages to extract functions and classes."""

    @staticmethod
    def parse(code: str, language: str) -> tuple[List[CodeFunction], List[CodeClass]]:
        """
        Parse code and extract functions and classes.

        Args:
            code: Source code string
            language: "python", "javascript", "typescript", or "java"

        Returns:
            (functions, classes)
        """
        language = language.lower().strip()

        if language == "python":
            return CodeParser._parse_python(code)
        elif language in ["javascript", "typescript"]:
            return CodeParser._parse_javascript(code)
        elif language == "java":
            return CodeParser._parse_java(code)
        else:
            logger.warning(f"Unsupported language: {language}, attempting JavaScript parser")
            return CodeParser._parse_javascript(code)

    @staticmethod
    def _parse_python(code: str) -> tuple[List[CodeFunction], List[CodeClass]]:
        """Parse Python code using AST module."""
        functions = []
        classes = []

        try:
            tree = ast.parse(code)
        except SyntaxError as e:
            logger.error(f"Python syntax error: {e}")
            return [], []

        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                # Only get top-level functions
                if node.col_offset == 0:
                    func = CodeParser._extract_python_function(node, code)
                    functions.append(func)

            elif isinstance(node, ast.ClassDef):
                # Extract class and its methods
                class_obj = CodeParser._extract_python_class(node, code)
                classes.append(class_obj)

        return functions, classes

    @staticmethod
    def _extract_python_function(node: ast.FunctionDef, code: str) -> CodeFunction:
        """Extract function details from AST node."""
        params = []
        for arg in node.args.args:
            params.append({"name": arg.arg, "type": "Any", "default": None})

        # Add defaults
        num_defaults = len(node.args.defaults)
        if num_defaults > 0:
            for i, default in enumerate(node.args.defaults):
                idx = len(params) - num_defaults + i
                if idx < len(params):
                    params[idx]["default"] = ast.unparse(default) if hasattr(ast, "unparse") else "..."

        # Extract return type annotation
        return_type = None
        if node.returns:
            return_type = ast.unparse(node.returns) if hasattr(ast, "unparse") else "Any"

        # Extract docstring
        docstring = ast.get_docstring(node) or ""

        # Get source code
        lines = code.split("\n")
        func_code = "\n".join(lines[node.lineno - 1 : node.end_lineno])

        return CodeFunction(
            name=node.name,
            params=params,
            return_type=return_type,
            description=docstring,
            source_code=func_code,
            language="python",
        )

    @staticmethod
    def _extract_python_class(node: ast.ClassDef, code: str) -> CodeClass:
        """Extract class and its methods."""
        methods = []

        for item in node.body:
            if isinstance(item, ast.FunctionDef) and not item.name.startswith("_"):
                method = CodeParser._extract_python_function(item, code)
                methods.append(method)

        docstring = ast.get_docstring(node) or ""

        lines = code.split("\n")
        class_code = "\n".join(lines[node.lineno - 1 : node.end_lineno])

        return CodeClass(
            name=node.name,
            methods=methods,
            description=docstring,
            source_code=class_code,
            language="python",
        )

    @staticmethod
    def _parse_javascript(code: str) -> tuple[List[CodeFunction], List[CodeClass]]:
        """Parse JavaScript/TypeScript code using regex patterns."""
        functions = []
        classes = []

        # Match function declarations: function name(params) { ... }
        func_pattern = r"(?:async\s+)?function\s+(\w+)\s*\((.*?)\)\s*(?::\s*(\w+|\w+\[\]|\w+\{\}))?\s*\{"
        for match in re.finditer(func_pattern, code):
            func_name = match.group(1)
            params_str = match.group(2)
            return_type = match.group(3) or "void"

            params = CodeParser._parse_js_params(params_str)
            func = CodeFunction(
                name=func_name,
                params=params,
                return_type=return_type,
                description="",
                source_code=match.group(0),
                language="javascript",
            )
            functions.append(func)

        # Match arrow functions: const name = (params) => { ... }
        arrow_pattern = r"const\s+(\w+)\s*=\s*(?:async\s*)?\((.*?)\)\s*(?::\s*(\w+|\w+\[\]|\w+\{\}))?\s*=>"
        for match in re.finditer(arrow_pattern, code):
            func_name = match.group(1)
            params_str = match.group(2)
            return_type = match.group(3) or "void"

            params = CodeParser._parse_js_params(params_str)
            func = CodeFunction(
                name=func_name,
                params=params,
                return_type=return_type,
                description="",
                source_code=match.group(0),
                language="javascript",
            )
            functions.append(func)

        # Match class definitions
        class_pattern = r"class\s+(\w+)\s*(?:extends\s+\w+)?\s*\{"
        for match in re.finditer(class_pattern, code):
            class_name = match.group(1)
            classes.append(
                CodeClass(
                    name=class_name,
                    methods=[],
                    description="",
                    source_code=match.group(0),
                    language="javascript",
                )
            )

        return functions, classes

    @staticmethod
    def _parse_js_params(params_str: str) -> List[Dict[str, str]]:
        """Parse JavaScript parameter string."""
        params = []
        if not params_str.strip():
            return params

        # Split by comma, handle destructuring
        parts = params_str.split(",")
        for part in parts:
            part = part.strip()
            if not part:
                continue

            # Handle destructuring and type annotations
            if ":" in part:
                name, type_str = part.split(":", 1)
                name = name.strip()
                type_str = type_str.strip().rstrip("=")
                params.append({"name": name, "type": type_str, "default": None})
            else:
                # Extract name (handle destructuring)
                name = re.sub(r"[{}=]", "", part).strip()
                params.append({"name": name, "type": "any", "default": None})

        return params

    @staticmethod
    def _parse_java(code: str) -> tuple[List[CodeFunction], List[CodeClass]]:
        """Parse Java code using regex patterns."""
        functions = []
        classes = []

        # Match method definitions: [visibility] [static] returnType methodName(params) [throws]
        method_pattern = r"(?:public|private|protected)?\s*(?:static)?\s*(\w+|\w+<\w+>)\s+(\w+)\s*\((.*?)\)\s*(?:throws\s+\w+)?\s*\{"

        for match in re.finditer(method_pattern, code):
            return_type = match.group(1)
            method_name = match.group(2)
            params_str = match.group(3)

            params = CodeParser._parse_java_params(params_str)
            func = CodeFunction(
                name=method_name,
                params=params,
                return_type=return_type,
                description="",
                source_code=match.group(0),
                language="java",
            )
            functions.append(func)

        # Match class definitions
        class_pattern = r"(?:public)?\s*class\s+(\w+)\s*(?:extends\s+\w+)?\s*(?:implements\s+[\w,\s]+)?\s*\{"

        for match in re.finditer(class_pattern, code):
            class_name = match.group(1)
            classes.append(
                CodeClass(
                    name=class_name,
                    methods=[],
                    description="",
                    source_code=match.group(0),
                    language="java",
                )
            )

        return functions, classes

    @staticmethod
    def _parse_java_params(params_str: str) -> List[Dict[str, str]]:
        """Parse Java parameter string."""
        params = []
        if not params_str.strip():
            return params

        # Split by comma
        parts = params_str.split(",")
        for part in parts:
            part = part.strip()
            if not part:
                continue

            # Format: Type name or Type[] name
            tokens = part.split()
            if len(tokens) >= 2:
                type_str = " ".join(tokens[:-1])  # Everything except last token is type
                name = tokens[-1].replace("[]", "").strip()
                params.append({"name": name, "type": type_str, "default": None})

        return params
