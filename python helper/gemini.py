import time
from google import genai

client = genai.Client(api_key="AIzaSyAAd7Q2eyvgaAc3LLkKdXHHBpt2wpUaLWM")

text = "Today we learn Sign Language"

prompt = f"An female indian person performing American Sign Language for ${text} "

operation = client.models.generate_videos(
    model="veo-3.0-generate-preview",
    prompt=prompt,
    
)

# Poll the operation status until the video is ready.
while not operation.done:
    print("Waiting for video generation to complete...")
    time.sleep(10)
    operation = client.operations.get(operation)

# Download the generated video.
print("operations : ", operation)
generated_video = operation.response.generated_videos[0]
client.files.download(file=generated_video.video)
generated_video.video.save("style_example.mp4")
print("Generated video saved to style_example.mp4")