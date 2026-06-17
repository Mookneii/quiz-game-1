package com.quizgame.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.quizgame.backend.dto.AiQuizGenerationRequest;
import com.quizgame.backend.dto.AiQuizGenerationResponse;
import com.quizgame.backend.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiQuizService {

    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${ollama.enabled:true}")
    private Boolean ollamaEnabled;

    @Value("${ollama.base-url:http://localhost:11434}")
    private String ollamaBaseUrl;

    @Value("${ollama.model:llama3.2:latest}")
    private String ollamaModel;

    private static final String OLLAMA_GENERATE_PATH = "/api/generate";
    private static final String OLLAMA_TAGS_PATH = "/api/tags";

    public AiQuizGenerationResponse generateQuizFromDocument(
            AiQuizGenerationRequest request, InputStream fileInputStream, String fileName) {

        try {
            // Extract text from document
            String documentContent = extractTextFromFile(fileName, fileInputStream);

            if (documentContent == null || documentContent.trim().isEmpty()) {
                throw new BadRequestException("Document appears to be empty or could not be processed.");
            }

            // Use local Ollama for generation
            String resolvedModel = resolveModelName(request.getModel());
            log.info("Ollama enabled: {}. Using model: {} at {}", ollamaEnabled, resolvedModel, ollamaBaseUrl);
            return generateQuizWithOllama(request, documentContent);

        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error generating quiz from document", e);
            throw new BadRequestException("Failed to generate quiz: " + e.getMessage());
        }
    }

    private String extractTextFromFile(String fileName, InputStream inputStream) throws IOException {
        String fileExtension = getFileExtension(fileName).toLowerCase();

        return switch (fileExtension) {
            case "pdf" -> extractTextFromPdf(inputStream);
            case "docx" -> extractTextFromDocx(inputStream);
            case "txt" -> extractTextFromTxt(inputStream);
            case "pptx" -> extractTextFromPptx(inputStream);
            default -> throw new BadRequestException("Unsupported file format: " + fileExtension);
        };
    }

    private String extractTextFromPdf(InputStream inputStream) throws IOException {
        try (PDDocument document = Loader.loadPDF(new RandomAccessReadBuffer(inputStream))) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }

    private String extractTextFromDocx(InputStream inputStream) throws IOException {
        StringBuilder text = new StringBuilder();
        try (XWPFDocument document = new XWPFDocument(inputStream)) {
            for (XWPFParagraph paragraph : document.getParagraphs()) {
                text.append(paragraph.getText()).append("\n");
            }
        }
        return text.toString();
    }

    private String extractTextFromTxt(InputStream inputStream) throws IOException {
        return new String(inputStream.readAllBytes());
    }

    private String extractTextFromPptx(InputStream inputStream) throws IOException {
        // For PPTX, we'll extract text from slides using Apache POI
        StringBuilder text = new StringBuilder();
        try (org.apache.poi.xslf.usermodel.XMLSlideShow slideShow = new org.apache.poi.xslf.usermodel.XMLSlideShow(
                inputStream)) {
            for (org.apache.poi.xslf.usermodel.XSLFSlide slide : slideShow.getSlides()) {
                for (org.apache.poi.xslf.usermodel.XSLFShape shape : slide.getShapes()) {
                    if (shape instanceof org.apache.poi.xslf.usermodel.XSLFTextShape textShape) {
                        text.append(textShape.getText()).append("\n");
                    }
                }
            }
        }
        return text.toString();
    }

    private String getFileExtension(String fileName) {
        int lastIndexOf = fileName.lastIndexOf(".");
        if (lastIndexOf == -1 || lastIndexOf == fileName.length() - 1) {
            throw new BadRequestException("Invalid file name");
        }
        return fileName.substring(lastIndexOf + 1);
    }

    private AiQuizGenerationResponse generateQuizWithOllama(
            AiQuizGenerationRequest request, String documentContent) {
        try {
            String resolvedModel = resolveModelName(request.getModel());
            validateModelExists(resolvedModel);
            String prompt = buildPrompt(request, documentContent);

            Map<String, Object> requestBody = Map.of(
                    "model", resolvedModel,
                    "prompt", prompt,
                    "stream", false,
                    "format", "json",
                    "options", Map.of(
                            "temperature", 0.7));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            String endpoint = ollamaBaseUrl + OLLAMA_GENERATE_PATH;

            @SuppressWarnings("unchecked")
            Map<String, Object> response = (Map<String, Object>) restTemplate.postForObject(endpoint, entity,
                    Map.class);

            if (response == null) {
                throw new BadRequestException("Ollama returned an empty response.");
            }

            Object responseText = response.get("response");
            if (!(responseText instanceof String text) || text.isBlank()) {
                throw new BadRequestException("Ollama response did not contain generated text.");
            }

            AiQuizGenerationResponse responsed = parseAiResponse(text);
            return enforceRequestedQuestionCount(responsed, request.getNumberOfQuestions());
        } catch (HttpStatusCodeException e) {
            String body = e.getResponseBodyAsString();
            log.error("Ollama HTTP error {} body: {}", e.getStatusCode(), body);
            throw new BadRequestException("Ollama API error " + e.getStatusCode().value() + ": " + body);
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error generating quiz with Ollama", e);
            throw new BadRequestException(
                    "Failed to generate quiz with Ollama. Ensure Ollama is running and model "
                            + resolveModelName(request.getModel()) + " is installed. Error: " + e.getMessage());
        }
    }

    private String resolveModelName(String requestedModel) {
        if (requestedModel != null && !requestedModel.isBlank()) {
            return requestedModel.trim();
        }

        return ollamaModel;
    }

    private void validateModelExists(String modelName) {
        if (modelName == null || modelName.isBlank()) {
            throw new BadRequestException("Model name cannot be empty.");
        }

        JsonNode response = fetchOllamaModels();
        List<String> availableModels = extractAvailableModelNames(response);

        if (availableModels.isEmpty()) {
            log.warn("Could not verify Ollama models from /api/tags; proceeding with model {}", modelName);
            return;
        }

        boolean exists = availableModels.stream()
                .map(name -> name.toLowerCase(Locale.ROOT))
                .anyMatch(name -> name.equals(modelName.toLowerCase(Locale.ROOT)));

        if (!exists) {
            throw new BadRequestException("Model '" + modelName + "' is not installed. Available models: "
                    + String.join(", ", availableModels));
        }
    }

    private JsonNode fetchOllamaModels() {
        String endpoint = ollamaBaseUrl + OLLAMA_TAGS_PATH;
        String responseBody = restTemplate.getForObject(endpoint, String.class);

        if (responseBody == null || responseBody.isBlank()) {
            return null;
        }

        try {
            return objectMapper.readTree(responseBody);
        } catch (Exception e) {
            log.warn("Failed to parse Ollama /api/tags response", e);
            return null;
        }
    }

    private List<String> extractAvailableModelNames(JsonNode response) {
        if (response == null) {
            return List.of();
        }

        JsonNode modelsNode = response.get("models");
        if (modelsNode == null || !modelsNode.isArray()) {
            return List.of();
        }

        List<String> modelNames = new ArrayList<>();
        for (JsonNode modelNode : modelsNode) {
            JsonNode nameNode = modelNode.get("name");
            if (nameNode != null && nameNode.isTextual()) {
                String name = nameNode.asText().trim();
                if (!name.isEmpty()) {
                    modelNames.add(name);
                }
            }
        }

        return modelNames;
    }

    private String buildPrompt(AiQuizGenerationRequest request, String documentContent) {
        String questionTypeJson = generateQuestionTypeJson(request);

        return String.format(
                """
                        Based on the following document content, generate exactly %d quiz questions at %s difficulty level.

                        Requirements:
                        - Generate questions in JSON format matching this structure:
                        %s
                        - Include a concise quiz description in the field named "description"
                        - Return exactly %d questions
                        - Do not return fewer or more questions than %d
                        - Use the field name "question" for the prompt text
                        - For MCQ questions, provide 4 distinct answers in answer1, answer2, answer3, answer4
                        - For MCQ questions, set correctAnswer to the key of the correct option: answer1, answer2, answer3, or answer4
                        - All questions must NEVER be empty and must be relevant to the document content
                        - Keep answers concise and accurate
                        - Make questions clear and educational
                        - Return ONLY valid JSON, no additional text or markdown formatting

                        Document content:
                        %s

                        Return ONLY valid JSON in this format:
                        {"title": "Quiz Title", "description": "Short quiz description", "questions": [...]}
                        """,
                request.getNumberOfQuestions(),
                request.getDifficulty().toLowerCase(),
                questionTypeJson,
                request.getNumberOfQuestions(),
                request.getNumberOfQuestions(),
                truncateContent(documentContent, 3000));
    }

    private String generateQuestionTypeJson(AiQuizGenerationRequest request) {
        if ("COMBINATION".equals(request.getQuestionType())) {
            return """
                    {
                      "title": "Quiz Title",
                                            "description": "Short quiz description",
                      "questions": [
                        {
                                                    "question": "Question text",
                          "type": "MCQ",
                                                    "answer1": "Choice 1 text",
                                                    "answer2": "Choice 2 text",
                                                    "answer3": "Choice 3 text",
                                                    "answer4": "Choice 4 text",
                                                    "correctAnswer": "answer2",
                          "difficulty": "EASY"
                        },
                        {
                                                    "question": "Short answer question",
                          "type": "SHORT_ANSWER",
                                                    "correctAnswer": "Short answer text",
                          "difficulty": "EASY"
                        }
                      ]
                    }
                    """;
        } else if ("SHORT_ANSWER".equals(request.getQuestionType())) {
            return """
                    {
                      "title": "Quiz Title",
                                            "description": "Short quiz description",
                      "questions": [
                        {
                                                    "question": "Question text",
                          "type": "SHORT_ANSWER",
                                                    "correctAnswer": "Short answer text",
                          "difficulty": "EASY"
                        }
                      ]
                    }
                    """;
        } else {
            return """
                    {
                      "title": "Quiz Title",
                                            "description": "Short quiz description",
                      "questions": [
                        {
                                                    "question": "Question text",
                          "type": "MCQ",
                                                    "answer1": "Choice 1 text",
                                                    "answer2": "Choice 2 text",
                                                    "answer3": "Choice 3 text",
                                                    "answer4": "Choice 4 text",
                                                    "correctAnswer": "answer2",
                          "difficulty": "EASY"
                        }
                      ]
                    }
                    """;
        }
    }

    private String truncateContent(String content, int maxLength) {
        if (content.length() > maxLength) {
            return content.substring(0, maxLength) + "...";
        }
        return content;
    }

    private AiQuizGenerationResponse parseAiResponse(String jsonContent) {
        try {
            String cleanJson = extractJsonPayload(jsonContent);
            AiQuizGenerationResponse response = objectMapper.readValue(cleanJson, AiQuizGenerationResponse.class);
            normalizeGeneratedQuiz(response);
            if (response.getDescription() == null || response.getDescription().isBlank()) {
                response.setDescription("Generated quiz based on the uploaded document.");
            }

            return response;
        } catch (Exception e) {
            log.error("Failed to parse AI response: {}", jsonContent, e);
            throw new BadRequestException("Failed to parse AI-generated quiz: " + e.getMessage());
        }
    }

    private void normalizeGeneratedQuiz(AiQuizGenerationResponse response) {
        if (response == null || response.getQuestions() == null) {
            return;
        }

        for (AiQuizGenerationResponse.AiQuestionDTO question : response.getQuestions()) {
            if (question == null) {
                continue;
            }

            if (!"MCQ".equalsIgnoreCase(question.getType())) {
                question.setCorrectChoiceIndex(null);
                continue;
            }

            Integer correctChoiceIndex = resolveCorrectChoiceIndex(question);
            question.setCorrectChoiceIndex(correctChoiceIndex);

            // Always canonicalize the correctAnswer to the form "answerN" when we can
            if (correctChoiceIndex != null) {
                question.setCorrectAnswer("answer" + (correctChoiceIndex + 1));
            }
        }
    }

    private Integer resolveCorrectChoiceIndex(AiQuizGenerationResponse.AiQuestionDTO question) {
        String correctAnswer = normalize(question.getCorrectAnswer());
        if (correctAnswer.isEmpty()) {
            return null;
        }

        // If already in answerN form, parse it
        if (correctAnswer.startsWith("answer") && correctAnswer.length() > 6) {
            try {
                int index = Integer.parseInt(correctAnswer.substring(6)) - 1;
                if (index >= 0 && index < 4) {
                    return index;
                }
            } catch (NumberFormatException ignored) {
            }
        }

        // Handle trailing numeric IDs like "super1" or "ans2" -> map to answer index
        try {
            String raw = question.getCorrectAnswer() == null ? "" : question.getCorrectAnswer();
            java.util.regex.Matcher m = java.util.regex.Pattern.compile("(\\d+)\\s*$").matcher(raw);
            if (m.find()) {
                int idx = Integer.parseInt(m.group(1)) - 1;
                if (idx >= 0 && idx < 4) {
                    return idx;
                }
            }
        } catch (Exception ignored) {
        }

        List<String> choices = List.of(
                question.getAnswer1(),
                question.getAnswer2(),
                question.getAnswer3(),
                question.getAnswer4());

        for (int index = 0; index < choices.size(); index++) {
            if (normalize(choices.get(index)).equals(correctAnswer)) {
                return index;
            }
        }

        return null;
    }

    private String normalize(String value) {
        if (value == null) {
            return "";
        }

        return value.trim().toLowerCase(Locale.ROOT);
    }

    private AiQuizGenerationResponse enforceRequestedQuestionCount(
            AiQuizGenerationResponse response, Integer requestedCount) {
        if (response == null) {
            throw new BadRequestException("AI response was empty");
        }

        if (requestedCount == null || requestedCount < 1) {
            throw new BadRequestException("Invalid number of requested questions");
        }

        List<AiQuizGenerationResponse.AiQuestionDTO> questions = response.getQuestions();
        if (questions == null) {
            throw new BadRequestException("AI response did not contain any questions.");
        }

        if (questions.size() < requestedCount) {
            throw new BadRequestException(String.format(
                    "AI returned %d questions, but %d were requested. Please try again.",
                    questions.size(), requestedCount));
        }

        if (questions.size() > requestedCount) {
            log.warn("AI returned {} questions but {} were requested. Trimming the response.",
                    questions.size(), requestedCount);
            response.setQuestions(new ArrayList<>(questions.subList(0, requestedCount)));
        }

        return response;
    }

    private String extractJsonPayload(String content) {
        if (content == null || content.isBlank()) {
            throw new BadRequestException("AI response was empty");
        }

        String text = content.trim()
                .replace("```json", "")
                .replace("```JSON", "")
                .replace("```", "")
                .trim();

        int firstBrace = text.indexOf('{');
        int firstBracket = text.indexOf('[');

        int start;
        if (firstBrace == -1 && firstBracket == -1) {
            throw new BadRequestException("AI response did not contain JSON");
        } else if (firstBrace == -1) {
            start = firstBracket;
        } else if (firstBracket == -1) {
            start = firstBrace;
        } else {
            start = Math.min(firstBrace, firstBracket);
        }

        int lastBrace = text.lastIndexOf('}');
        int lastBracket = text.lastIndexOf(']');
        int end = Math.max(lastBrace, lastBracket);

        if (end < start) {
            throw new BadRequestException("AI response JSON boundaries were invalid");
        }

        return text.substring(start, end + 1).trim();
    }
}
