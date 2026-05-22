from abc import ABC, abstractmethod
from typing import AsyncGenerator, Optional, Dict, Any, List
import base64
import json
from loguru import logger
import groq
from openai import AsyncOpenAI
import httpx

from .config import settings

class ProviderError(Exception):
    pass

class RateLimitError(ProviderError):
    pass

class ProviderUnavailableError(ProviderError):
    pass

class AllProvidersFailedError(Exception):
    pass

class LLMProvider(ABC):
    @abstractmethod
    async def generate(self, prompt: str, system: str = "", **kwargs) -> str:
        pass

    @abstractmethod
    async def stream(self, prompt: str, system: str = "", **kwargs) -> AsyncGenerator[str, None]:
        pass

    async def generate_with_image(
        self, prompt: str, image_bytes: bytes, mime_type: str = "image/jpeg",
        system: str = "", **kwargs
    ) -> str:
        """Generate a response from a text prompt + image (vision/multimodal).
        
        Override in subclasses that support vision. Falls back to text-only
        generation with a warning if not overridden.
        """
        logger.warning(f"{self.__class__.__name__} does not support vision — falling back to text-only.")
        return await self.generate(prompt, system=system, **kwargs)

class GroqProvider(LLMProvider):
    def __init__(self, api_key: str):
        if not api_key:
            raise ValueError("Groq API key is required")
        self.client = groq.AsyncGroq(api_key=api_key)
        self.default_model = settings.DEFAULT_MODEL

    async def generate(self, prompt: str, system: str = "", **kwargs) -> str:
        model = kwargs.get("model", self.default_model)
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        try:
            response = await self.client.chat.completions.create(
                messages=messages,
                model=model,
                temperature=kwargs.get("temperature", 0.7),
                max_tokens=kwargs.get("max_tokens", 8000),
            )
            return response.choices[0].message.content
        except groq.RateLimitError as e:
            logger.warning(f"Groq Rate Limit Exceeded: {e}")
            raise RateLimitError("Groq rate limit exceeded") from e
        except Exception as e:
            logger.error(f"Groq generation failed: {e}")
            raise ProviderUnavailableError(f"Groq unavailable: {e}") from e

    async def generate_with_image(
        self, prompt: str, image_bytes: bytes, mime_type: str = "image/jpeg",
        system: str = "", **kwargs
    ) -> str:
        """Send an image + text prompt to a Groq vision model (e.g. Llama 4 Scout)."""
        model = kwargs.get("model", self.default_model)
        b64 = base64.b64encode(image_bytes).decode("utf-8")
        data_uri = f"data:{mime_type};base64,{b64}"

        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": data_uri}},
            ],
        })

        try:
            response = await self.client.chat.completions.create(
                messages=messages,
                model=model,
                temperature=kwargs.get("temperature", 0.3),
            )
            return response.choices[0].message.content
        except groq.RateLimitError as e:
            logger.warning(f"Groq Rate Limit Exceeded (vision): {e}")
            raise RateLimitError("Groq rate limit exceeded") from e
        except Exception as e:
            logger.error(f"Groq vision generation failed: {e}")
            raise ProviderUnavailableError(f"Groq vision unavailable: {e}") from e

    async def stream(self, prompt: str, system: str = "", **kwargs) -> AsyncGenerator[str, None]:
        model = kwargs.get("model", self.default_model)
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        try:
            stream = await self.client.chat.completions.create(
                messages=messages,
                model=model,
                temperature=kwargs.get("temperature", 0.7),
                max_tokens=kwargs.get("max_tokens", 8000),
                stream=True
            )
            async for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content
        except groq.RateLimitError as e:
            logger.warning(f"Groq Rate Limit Exceeded during stream: {e}")
            raise RateLimitError("Groq rate limit exceeded") from e
        except Exception as e:
            logger.error(f"Groq streaming failed: {e}")
            raise ProviderUnavailableError(f"Groq unavailable: {e}") from e

class OpenAIProvider(LLMProvider):
    def __init__(self, api_key: Optional[str]):
        if not api_key:
            raise ValueError("OpenAI API key is required")
        self.client = AsyncOpenAI(api_key=api_key)
        self.default_model = "gpt-4o-mini" # Example default

    async def generate(self, prompt: str, system: str = "", **kwargs) -> str:
        model = kwargs.get("model", self.default_model)
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        try:
            response = await self.client.chat.completions.create(
                messages=messages,
                model=model,
                temperature=kwargs.get("temperature", 0.7),
                max_tokens=kwargs.get("max_tokens", 8000),
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"OpenAI generation failed: {e}")
            raise ProviderUnavailableError(f"OpenAI unavailable: {e}") from e

    async def generate_with_image(
        self, prompt: str, image_bytes: bytes, mime_type: str = "image/jpeg",
        system: str = "", **kwargs
    ) -> str:
        """Send an image + text prompt to an OpenAI vision model."""
        model = kwargs.get("model", "gpt-4o-mini")
        b64 = base64.b64encode(image_bytes).decode("utf-8")
        data_uri = f"data:{mime_type};base64,{b64}"

        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": data_uri}},
            ],
        })

        try:
            response = await self.client.chat.completions.create(
                messages=messages,
                model=model,
                temperature=kwargs.get("temperature", 0.3),
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"OpenAI vision generation failed: {e}")
            raise ProviderUnavailableError(f"OpenAI vision unavailable: {e}") from e

    async def stream(self, prompt: str, system: str = "", **kwargs) -> AsyncGenerator[str, None]:
        model = kwargs.get("model", self.default_model)
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        try:
            stream = await self.client.chat.completions.create(
                messages=messages,
                model=model,
                temperature=kwargs.get("temperature", 0.7),
                max_tokens=kwargs.get("max_tokens", 8000),
                stream=True
            )
            async for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            logger.error(f"OpenAI streaming failed: {e}")
            raise ProviderUnavailableError(f"OpenAI unavailable: {e}") from e

class OllamaProvider(LLMProvider):
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip('/')
        self.default_model = "llama3.1:8b" # Example local default

    async def generate(self, prompt: str, system: str = "", **kwargs) -> str:
        model = kwargs.get("model", self.default_model)
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        
        payload = {
            "model": model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": kwargs.get("temperature", 0.7)
            }
        }
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(f"{self.base_url}/api/chat", json=payload, timeout=60.0)
                response.raise_for_status()
                data = response.json()
                return data["message"]["content"]
        except Exception as e:
            logger.error(f"Ollama generation failed: {e}")
            raise ProviderUnavailableError(f"Ollama unavailable: {e}") from e

    async def stream(self, prompt: str, system: str = "", **kwargs) -> AsyncGenerator[str, None]:
        model = kwargs.get("model", self.default_model)
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        
        payload = {
            "model": model,
            "messages": messages,
            "stream": True,
            "options": {
                "temperature": kwargs.get("temperature", 0.7)
            }
        }
        
        try:
            async with httpx.AsyncClient() as client:
                async with client.stream("POST", f"{self.base_url}/api/chat", json=payload, timeout=60.0) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if line:
                            data = json.loads(line)
                            if "message" in data and "content" in data["message"]:
                                yield data["message"]["content"]
        except Exception as e:
            logger.error(f"Ollama streaming failed: {e}")
            raise ProviderUnavailableError(f"Ollama unavailable: {e}") from e


class AIEngine:
    """
    Fallback chain: Groq → OpenAI → Ollama
    If primary provider fails, automatically tries next.
    """
    def __init__(self):
        self.providers: Dict[str, LLMProvider] = {}
        self._init_providers()
        
        # Determine preferred order based on config, falling back
        # to hardcoded safe defaults.
        configured_default = settings.DEFAULT_LLM_PROVIDER
        
        self.fallback_order = []
        if configured_default == "groq":
            self.fallback_order = ["groq", "openai", "ollama"]
        elif configured_default == "openai":
            self.fallback_order = ["openai", "groq", "ollama"]
        elif configured_default == "ollama":
             self.fallback_order = ["ollama", "groq", "openai"]
        else:
            self.fallback_order = ["groq", "openai", "ollama"]

    def _init_providers(self):
        try:
            if settings.GROQ_API_KEY and settings.GROQ_API_KEY != "gsk_your_groq_api_key_here":
                self.providers["groq"] = GroqProvider(api_key=settings.GROQ_API_KEY)
        except Exception as e:
            logger.warning(f"Failed to initialize Groq provider: {e}")

        try:
            if settings.OPENAI_API_KEY and settings.OPENAI_API_KEY != "sk-your_openai_key_here":
                self.providers["openai"] = OpenAIProvider(api_key=settings.OPENAI_API_KEY)
        except Exception as e:
            logger.warning(f"Failed to initialize OpenAI provider: {e}")

        try:
            if settings.OLLAMA_BASE_URL:
                 self.providers["ollama"] = OllamaProvider(base_url=settings.OLLAMA_BASE_URL)
        except Exception as e:
             logger.warning(f"Failed to initialize Ollama provider: {e}")
             
        logger.info(f"Initialized AI Engine with providers: {list(self.providers.keys())}")

    async def generate(self, prompt: str, system: str = "", **kwargs) -> str:
        last_error = None
        for provider_name in self.fallback_order:
            provider = self.providers.get(provider_name)
            if provider is None:
                continue
            
            logger.debug(f"Attempting generation with {provider_name}")
            try:
                return await provider.generate(prompt, system=system, **kwargs)
            except RateLimitError as e:
                logger.warning(f"{provider_name} rate limited, trying next...")
                last_error = "rate_limited"
                continue
            except ProviderUnavailableError as e:
                logger.warning(f"{provider_name} unavailable, trying next...")
                last_error = "unavailable"
                continue
            except Exception as e:
                logger.error(f"Unexpected error with {provider_name}: {e}")
                last_error = "unexpected_error"
                continue
                
        logger.error(f"All AI providers failed. Last error: {last_error}")
        raise AllProvidersFailedError(last_error)

    async def generate_stream(self, prompt: str, system: str = "", **kwargs) -> AsyncGenerator[str, None]:
        last_error = None
        for provider_name in self.fallback_order:
            provider = self.providers.get(provider_name)
            if provider is None:
                continue
            
            logger.debug(f"Attempting streaming generation with {provider_name}")
            try:
                # We need to yield from the generator
                stream_generator = provider.stream(prompt, system=system, **kwargs)
                # Check if we can get the first chunk, if not, it will raise error and fallback
                first_chunk_received = False
                async for chunk in stream_generator:
                    first_chunk_received = True
                    yield chunk
                
                # If we successfully yielded chunks, we are done
                if first_chunk_received:
                    return
                
            except RateLimitError as e:
                logger.warning(f"{provider_name} rate limited, trying next...")
                last_error = "rate_limited"
                continue
            except ProviderUnavailableError as e:
                logger.warning(f"{provider_name} unavailable, trying next...")
                last_error = "unavailable"
                continue
            except Exception as e:
                logger.error(f"Unexpected error with {provider_name} during streaming: {e}")
                last_error = "unexpected_error"
                continue
                
        logger.error(f"All AI providers failed for streaming. Last error: {last_error}")
        raise AllProvidersFailedError(last_error)

    async def generate_with_image(
        self, prompt: str, image_bytes: bytes, mime_type: str = "image/jpeg",
        system: str = "", **kwargs
    ) -> str:
        """Generate a response from a text prompt + image using the fallback chain."""
        last_error = None
        for provider_name in self.fallback_order:
            provider = self.providers.get(provider_name)
            if provider is None:
                continue

            logger.debug(f"Attempting vision generation with {provider_name}")
            try:
                return await provider.generate_with_image(
                    prompt, image_bytes, mime_type=mime_type, system=system, **kwargs
                )
            except RateLimitError:
                logger.warning(f"{provider_name} rate limited (vision), trying next...")
                last_error = "rate_limited"
                continue
            except ProviderUnavailableError:
                logger.warning(f"{provider_name} unavailable (vision), trying next...")
                last_error = "unavailable"
                continue
            except Exception as e:
                logger.error(f"Unexpected error with {provider_name} (vision): {e}")
                last_error = "unexpected_error"
                continue

        logger.error(f"All AI providers failed for vision. Last error: {last_error}")
        raise AllProvidersFailedError(last_error)

ai_engine = AIEngine()
