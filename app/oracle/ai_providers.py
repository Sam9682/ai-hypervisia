"""AI Provider implementations for Oracle"""
import asyncio
import time
import json
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
import httpx
from app.config import settings
from app.logging_config import logger


class AIProvider(ABC):
    """Base class for AI providers"""
    
    @abstractmethod
    async def query(
        self,
        question: str,
        context: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> Dict[str, Any]:
        """Query the AI provider"""
        pass


class KiroAIProvider(AIProvider):
    """Kiro CLI AI Provider - Uses local Ubuntu session with kiro-cli"""
    
    async def query(
        self,
        question: str,
        context: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> Dict[str, Any]:
        """Query Kiro AI via CLI"""
        start_time = time.time()
        
        try:
            # Construct the prompt
            prompt = question
            if context:
                prompt = f"Contexte: {context}\n\nQuestion: {question}"
            
            # Escape quotes in prompt
            prompt = prompt.replace('"', '\\"').replace('$', '\\$')
            
            # Execute kiro-cli command with timeout
            process = await asyncio.create_subprocess_shell(
                f'echo "{prompt}" | timeout 30 kiro-cli --temperature {temperature} --max-tokens {max_tokens}',
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            try:
                stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=35.0)
            except asyncio.TimeoutError:
                process.kill()
                logger.error("Kiro CLI timeout after 35 seconds")
                raise Exception("Kiro CLI timeout - la requête a pris trop de temps")
            
            if process.returncode != 0:
                error_msg = stderr.decode() if stderr else "Unknown error"
                logger.error(f"Kiro CLI error: {error_msg}")
                
                # Check if kiro-cli is not installed
                if "not found" in error_msg or "command not found" in error_msg:
                    raise Exception("Kiro CLI n'est pas installé sur ce serveur. Veuillez utiliser un autre fournisseur d'IA.")
                
                raise Exception(f"Kiro CLI a échoué: {error_msg}")
            
            answer = stdout.decode().strip()
            
            if not answer:
                raise Exception("Kiro CLI n'a pas retourné de réponse")
            
            processing_time = time.time() - start_time
            
            return {
                "answer": answer,
                "processing_time": processing_time,
                "tokens_used": len(answer.split()),  # Approximation
                "provider": "kiro"
            }
            
        except Exception as e:
            logger.error(f"Kiro AI query failed: {str(e)}")
            raise


class ShaiAIProvider(AIProvider):
    """Shai AI Provider - OVH's AI service"""
    
    def __init__(self):
        self.api_key = getattr(settings, "SHAI_API_KEY", None)
        self.api_url = getattr(settings, "SHAI_API_URL", "https://api.ovh.com/shai/v1/chat")
    
    async def query(
        self,
        question: str,
        context: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> Dict[str, Any]:
        """Query Shai AI via OVH API"""
        start_time = time.time()
        
        if not self.api_key:
            raise Exception("SHAI_API_KEY not configured")
        
        try:
            messages = []
            if context:
                messages.append({"role": "system", "content": context})
            messages.append({"role": "user", "content": question})
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.api_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "messages": messages,
                        "temperature": temperature,
                        "max_tokens": max_tokens
                    },
                    timeout=60.0
                )
                
                response.raise_for_status()
                data = response.json()
                
                answer = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                tokens_used = data.get("usage", {}).get("total_tokens", 0)
                
                processing_time = time.time() - start_time
                
                return {
                    "answer": answer,
                    "processing_time": processing_time,
                    "tokens_used": tokens_used,
                    "provider": "shai"
                }
                
        except Exception as e:
            logger.error(f"Shai AI query failed: {str(e)}")
            raise


class OpenAIProvider(AIProvider):
    """OpenAI Provider - Fallback option"""
    
    def __init__(self):
        self.api_key = getattr(settings, "OPENAI_API_KEY", None)
        self.api_url = "https://api.openai.com/v1/chat/completions"
        self.model = getattr(settings, "OPENAI_MODEL", "gpt-4")
    
    async def query(
        self,
        question: str,
        context: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> Dict[str, Any]:
        """Query OpenAI API"""
        start_time = time.time()
        
        if not self.api_key:
            raise Exception("OPENAI_API_KEY not configured")
        
        try:
            messages = []
            if context:
                messages.append({"role": "system", "content": context})
            messages.append({"role": "user", "content": question})
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.api_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": messages,
                        "temperature": temperature,
                        "max_tokens": max_tokens
                    },
                    timeout=60.0
                )
                
                response.raise_for_status()
                data = response.json()
                
                answer = data["choices"][0]["message"]["content"]
                tokens_used = data["usage"]["total_tokens"]
                
                processing_time = time.time() - start_time
                
                return {
                    "answer": answer,
                    "processing_time": processing_time,
                    "tokens_used": tokens_used,
                    "provider": "openai"
                }
                
        except Exception as e:
            logger.error(f"OpenAI query failed: {str(e)}")
            raise


def get_ai_provider(provider_name: str) -> AIProvider:
    """Factory function to get AI provider instance"""
    providers = {
        "kiro": KiroAIProvider,
        "shai": ShaiAIProvider,
        "openai": OpenAIProvider
    }
    
    provider_class = providers.get(provider_name)
    if not provider_class:
        raise ValueError(f"Unknown AI provider: {provider_name}")
    
    return provider_class()
