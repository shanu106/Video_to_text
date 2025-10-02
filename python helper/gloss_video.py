from moviepy import VideoFileClip, concatenate_videoclips


gloss_map = {
    "HELLO":"clips/hello.mp4",
    "MY": "clips/my.mp4",
    "NAME": "clips/name.mp4",
    "TODAY": "clips/today.mp4",
    "LEARN": "clips/learn.mp4",
    "AI": "clips/ai.mp4",
    "FINGERSPELL": "clips/fingerspell.mp4"
}

def generate_asl_video(gloss, output_file="tutorial.mp4"):
    words = gloss.split()
    clips = [VideoFileClip(gloss_map.get(w, gloss_map["FINGERSPELL"])) for w in words]
    final = concatenate_videoclips(clips)
    final.write_videofile(output_file,codec="libx264")
    print("done")

generate_asl_video("HELLO MY NAME S-H-A-H-N-W-A-J")

